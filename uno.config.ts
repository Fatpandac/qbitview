import { presetWind } from "@unocss/preset-wind3";
import { defineConfig } from "unocss";
import { presetAnimations } from "unocss-preset-animations";
import { builtinColors, presetShadcn } from 'unocss-preset-shadcn'

export default defineConfig({
  presets: [
    presetWind(),
    presetAnimations(),
    presetShadcn(builtinColors.map(c => ({ color: c }))),
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        "(components|src)/**/*.{js,ts}",
      ],
    },
  },
});
