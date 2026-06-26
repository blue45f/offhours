import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "offhours",
  brand: {
    primaryColor: "#D98B63",
  },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  webView: {},
  webBundleDir: "dist",
  navigationBar: { withBackButton: true, withHomeButton: true },
});
