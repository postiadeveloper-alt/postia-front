# Postia - Next.js Frontend

Modern web application for social media management, migrated from React Native.

## 🚀 Features

- **Content Calendar**: Plan and schedule Instagram posts
- **Analytics Dashboard**: Track performance metrics and insights
- **Trending Topics**: Discover trending hashtags and content ideas
- **Post Management**: Create, schedule, and publish posts
- **Profile Settings**: Manage connected Instagram accounts

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **API Client**: Axios

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_INSTAGRAM_APP_ID`: Instagram App ID
- `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI`: Instagram OAuth redirect URI

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
frontend-next/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/               # UI components (Button, Input)
│   ├── Header.tsx        # Dashboard header
│   └── Sidebar.tsx       # Navigation sidebar
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utilities and services
│   ├── api.service.ts    # API client
│   ├── constants.ts      # App constants
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## 🎨 Design Features

- **Glassmorphism Effects**: Modern glass-like UI elements
- **Dark Mode**: Sleek dark theme by default
- **Vibrant Gradients**: Eye-catching color schemes
- **Smooth Animations**: Micro-interactions for better UX
- **Responsive Design**: Works on all devices

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔗 Related Projects

- **Backend**: `../backend` - Node.js/Express API server

## ⚙️ Configuration

The app uses Tailwind CSS with a custom theme configured in `tailwind.config.ts`. Main colors:
- Primary: `#ee3ec9` (pink)
- Background: `#0a0a1a` (dark blue)
- Accent: Gradients and glassmorphism effects

## 📄 License

Private
