import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles.css';
import './immersive.css';
import './community.css';
import './home-entry.css';
import './character-cards.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
