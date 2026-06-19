import { toast } from 'sonner'

import { shareOrCopy, type ShareInput, type ShareResult } from './shareOrCopy'

type ShareWithToastOptions = {
  /** 클립보드 복사로 폴백됐을 때 보여줄 토스트(기본: "공유 링크를 복사했어요"). */
  copiedMessage?: string
}

/**
 * shareOrCopy 를 sonner 토스트와 묶은 앱 표준 공유 핸들러.
 * - 네이티브 공유 시트가 뜨면 OS 시트 자체가 피드백이라 토스트를 띄우지 않는다.
 * - 클립보드로 폴백되면 복사 안내 토스트를, 둘 다 불가하면 에러 토스트를 띄운다.
 * - 사용자가 시트를 닫으면(dismissed) 조용히 넘어간다.
 */
export async function shareWithToast(
  input: ShareInput,
  options: ShareWithToastOptions = {}
): Promise<ShareResult> {
  const result = await shareOrCopy(input)
  if (result === 'copied') {
    toast.success(options.copiedMessage ?? '공유 링크를 복사했어요')
  } else if (result === 'unsupported') {
    toast.error('공유에 실패했어요. 주소창의 링크를 직접 복사해주세요.')
  }
  return result
}
