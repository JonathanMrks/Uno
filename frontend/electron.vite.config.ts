import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    assetsInclude: "src/renderer/assets/**",
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared"),
        "@/utils": resolve("src/renderer/src/utils"),
        "@/assets": resolve("src/renderer/src/assets"),
        "@/store": resolve("src/renderer/src/store"),
        "@/components": resolve("src/renderer/src/components"),
      },
    },
    plugins: [react()],
  },
});
