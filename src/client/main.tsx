import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { DeploymentNotice } from './DeploymentNotice.js';
import './styles.css';
import './immersive.css';
import './community.css';
import './home-entry.css';
import './character-cards.css';
import './room-experience.css';
import './race-ui.css';
import './visual-first.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><DeploymentNotice /><App /></React.StrictMode>);
