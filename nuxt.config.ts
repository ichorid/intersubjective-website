// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  modules: [
    "@vueuse/nuxt",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    "@nuxt/content",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxtjs/color-mode",
    "@nuxtjs/sitemap",
  ],
  imports: {
    presets: [
      {
        from: "vue-sonner",
        imports: ["toast"],
      },
    ],
  },
  app: {
    head: {
      script: [
        {
          src: "/tsparticles.all.bundle.min.js",
          defer: true,
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },

  css: ["~/assets/style/main.css"],

  colorMode: {
    preference: "dark",
    fallback: "dark",
    classPrefix: "",
    classSuffix: "",
  },

  content: {
    renderer: {
      anchorLinks: false,
    },
    preview: {
      api: "https://api.nuxt.studio",
      dev: true,
    },
  },

  mdc: {
    highlight: {
      theme: {
        dark: "github-dark",
        default: "github-dark",
        light: "github-light",
      },
    },
  },

  runtimeConfig: {
    public: {
      site:
        process.env.NUXT_PUBLIC_SITE_URL || "https://intersubjective.space/",
      contactEmail: process.env.CONTACT_EMAIL,
      resend: !!process.env.NUXT_PRIVATE_RESEND_API_KEY,
      recaptchaSiteKey: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
    },
    private: {
      recaptchaSecretKey: process.env.NUXT_PRIVATE_RECAPTCHA_SECRET_KEY,
    },
  },

  routeRules: {
    "/": { prerender: false },
    '/public/**': { cache: { maxAge: 60 * 60 * 24 * 30 } },
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    viewTransition: true,
    renderJsonPayloads: true,
  },
  nitro: {
    experimental: {
      websocket: true,
    },
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: true,
      routes: ["/"],
    },
    compressPublicAssets: true,
  },

  hooks: {
    "nitro:config": (config) => {
      if (process.env.NUXT_PRIVATE_RESEND_API_KEY) {
        config.handlers?.push({
          method: "post",
          route: "/api/emails/send",
          handler: "~~/server/emails/send.ts",
        });
        config.handlers?.push({
          method: "post",
          route: "/api/emails/subscribe",
          handler: "~~/server/emails/subscribe.ts",
        });
      }
    },
  },

  i18n: {
    locales: [{ code: "en", name: "English", language: "en-US" }],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
    strategy: "prefix_except_default",
    defaultLocale: "en",
    vueI18n: "~/i18n.config.ts",
  },

  icon: {
    customCollections: [
      {
        prefix: "custom",
        dir: "./app/assets/icons",
      },
    ],
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
    provider: "iconify",
  },
  
  sitemap: {
    autoLastmod: true,
    xsl: false,
  },
  
  devtools: { enabled: true },
});