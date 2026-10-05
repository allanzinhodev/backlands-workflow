export type Locale = 'pt' | 'en'

export interface Copy {
  brand: string
  nav: {
    home: string
    features: string
    world: string
    faq: string
    menu: string
    closeMenu: string
    skip: string
    navigation: string
  }
  hero: {
    eyebrow: string
    title: string
    description: string
    explore: string
  }
  progress: { label: string; current: string; stages: readonly string[] }
  features: {
    eyebrow: string
    title: string
    subtitle: string
    previous: string
    next: string
    position: string
    carousel: string
    items: readonly { number: string; title: string; description: string }[]
  }
  world: { eyebrow: string; title: string }
  faq: { eyebrow: string; title: string }
  footer: {
    tagline: string
    download: string
    register: string
    soon: string
    copyright: string
  }
  language: { label: string; pt: string; en: string }
  metadata: { title: string; description: string }
}

// Every visitor-facing string belongs in both catalogs. The shared type keeps
// additions to one language from silently leaving the other language incomplete.
export const catalog = {
  pt: {
    brand: 'Backlands',
    nav: {
      home: 'HOME',
      features: 'O QUE TEMOS',
      world: 'NOSSO MUNDO',
      faq: 'FAQ',
      menu: 'Abrir menu',
      closeMenu: 'Fechar menu',
      skip: 'Ir para o conteúdo',
      navigation: 'Navegação principal',
    },
    hero: {
      eyebrow: 'Um novo mundo. Nossas raízes.',
      title: 'Backlands Online!',
      description:
        'Acompanhe a imersão do mundo de Backlands um RPG Oldschool neo Medieval inspirado na cultura regional dos estados Brasileiros e seu folclore.',
      explore: 'Conheça Backlands',
    },
    progress: {
      label: 'Nossa jornada',
      current: 'Pré Launch',
      stages: ['Pré Alpha', 'Alpha', 'Beta', 'Oficial Launch'],
    },
    features: {
      eyebrow: 'O espírito de Backlands',
      title: 'O que temos?',
      subtitle: 'Um pouco das nossas features',
      previous: 'Feature anterior',
      next: 'Próxima feature',
      position: '{current} de {total}',
      carousel: 'Destaques do jogo',
      items: [
        {
          number: '01',
          title: 'RPG Oldschool',
          description:
            'A essência dos RPGs clássicos em um universo neo Medieval. Uma jornada com as raízes do oldschool.',
        },
        {
          number: '02',
          title: 'Folclore brasileiro',
          description:
            'Lendas e histórias do nosso folclore inspiram o mundo de Backlands e dão identidade à aventura.',
        },
        {
          number: '03',
          title: 'Cultura regional',
          description:
            'Um mundo inspirado na riqueza cultural dos estados brasileiros, suas tradições e suas muitas histórias.',
        },
      ],
    },
    world: { eyebrow: 'Além do horizonte', title: 'Um pouco do nosso mundo' },
    faq: { eyebrow: 'Perguntas & respostas', title: 'FAQ' },
    footer: {
      tagline: 'Uma aventura com raízes brasileiras.',
      download: 'Baixar jogo',
      register: 'Cadastrar',
      soon: 'Em breve',
      copyright: 'Todos os direitos reservados.',
    },
    language: { label: 'Idioma do site', pt: 'Português', en: 'English' },
    metadata: {
      title: 'Backlands Online — RPG com raízes brasileiras',
      description:
        'Conheça Backlands Online, um RPG Oldschool neo Medieval inspirado na cultura regional brasileira e em seu folclore.',
    },
  },
  en: {
    brand: 'Backlands',
    nav: {
      home: 'HOME',
      features: 'FEATURES',
      world: 'OUR WORLD',
      faq: 'FAQ',
      menu: 'Open menu',
      closeMenu: 'Close menu',
      skip: 'Skip to content',
      navigation: 'Main navigation',
    },
    hero: {
      eyebrow: 'A new world. Our roots.',
      title: 'Backlands Online!',
      description:
        'Immerse yourself in the world of Backlands, an Oldschool neo Medieval RPG inspired by the regional cultures of Brazil and their folklore.',
      explore: 'Discover Backlands',
    },
    progress: {
      label: 'Our journey',
      current: 'Pre Launch',
      stages: ['Pre Alpha', 'Alpha', 'Beta', 'Official Launch'],
    },
    features: {
      eyebrow: 'The spirit of Backlands',
      title: 'What do we have?',
      subtitle: 'A glimpse of our features',
      previous: 'Previous feature',
      next: 'Next feature',
      position: '{current} of {total}',
      carousel: 'Game highlights',
      items: [
        {
          number: '01',
          title: 'Oldschool RPG',
          description:
            'The essence of classic RPGs in a neo Medieval universe. A journey rooted in the oldschool spirit.',
        },
        {
          number: '02',
          title: 'Brazilian folklore',
          description:
            'Legends and stories from Brazilian folklore inspire the world of Backlands and give the adventure its identity.',
        },
        {
          number: '03',
          title: 'Regional culture',
          description:
            'A world inspired by the cultural richness of Brazil’s states, their traditions, and their many stories.',
        },
      ],
    },
    world: { eyebrow: 'Beyond the horizon', title: 'A glimpse of our world' },
    faq: { eyebrow: 'Questions & answers', title: 'FAQ' },
    footer: {
      tagline: 'An adventure with Brazilian roots.',
      download: 'Download game',
      register: 'Sign up',
      soon: 'Coming soon',
      copyright: 'All rights reserved.',
    },
    language: { label: 'Website language', pt: 'Português', en: 'English' },
    metadata: {
      title: 'Backlands Online — An RPG with Brazilian roots',
      description:
        'Discover Backlands Online, an Oldschool neo Medieval RPG inspired by Brazil’s regional cultures and folklore.',
    },
  },
} satisfies Record<Locale, Copy>
