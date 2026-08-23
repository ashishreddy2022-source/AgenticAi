import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }) {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <Head>
        <title>Agentflow AI - Operations Automation Platform</title>
        <meta
          name="description"
          content="Agentic AI Operations Platform. Transform natural language prompts into executable visual workflows orchestrated by cooperating AI agents."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="dark min-h-screen bg-background text-slate-100 antialiased selection:bg-primary-500 selection:text-white">
        <Component {...pageProps} />
      </div>
    </>
  );
}
