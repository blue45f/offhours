import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_EDGE_PX, dataUrlBytes } from '@offhours/shared'

/**
 * 파일 → 첨부용 data-URL. 긴 변을 1600px 이하로 캔버스 리사이즈한 뒤 JPEG 로 인코딩한다.
 * 결과가 2MB(디코드 기준)를 넘으면 품질을 한 단계 낮춰 재시도하고, 그래도 넘으면 거절.
 */
export async function fileToAttachment(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 첨부할 수 있어요')
  }
  const image = await loadImage(file)
  for (const quality of [0.82, 0.6]) {
    const dataUrl = drawToDataUrl(image, quality)
    if (dataUrlBytes(dataUrl) <= ATTACHMENT_MAX_BYTES) return dataUrl
  }
  throw new Error('이미지가 너무 커요 (2MB 제한)')
}

function drawToDataUrl(image: HTMLImageElement, quality: number): string {
  const scale = Math.min(1, ATTACHMENT_MAX_EDGE_PX / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('이미지 처리에 실패했어요')
  // JPEG 는 알파를 지원하지 않으므로 투명 영역은 흰 배경으로 깐다
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 읽을 수 없어요'))
    }
    img.src = url
  })
}
