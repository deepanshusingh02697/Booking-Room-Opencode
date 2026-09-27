import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1F2867',
        brand: '#2C60F2',
        tint: '#F4F5FE',
        hairline: '#D3D3D3',
        mist: '#DDDFE8',
        ink: '#232324',
        copy: '#363636',
        label: '#272727',
        muted: '#6B7180',
        idle: '#767676',
        hint: '#808080',
        navySoft: '#41487E',
        navyLabel: '#D2D4E1',
        shell: '#F5F5F5',
        heading: '#191E2B',
        body: '#3B4352',
        statLabel: '#4D5664',
        faint: '#999FAC',
        rule: '#E5E6EA',
        tintStrong: '#EEF0FE',
        roleBg: '#FFFBEC',
        roleRule: '#FAE591',
        roleInk: '#AC5415',
      },
    },
  },
  plugins: [],
} satisfies Config;