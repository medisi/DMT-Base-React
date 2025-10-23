import React, { useEffect, useState } from 'react';
import './App.css';
import './styles/theme.css'
import './styles/color_scheme.css'
import { Route, Routes } from 'react-router';
import Home from './pages/Home/Home';
import AllDocuments from './pages/AllDocuments/AllDocuments';
import Settings from './pages/Settings/Settings';
import { AuthProvider } from './AuthContext';
import Login from './pages/Login/Login';
import OpenDocument from './pages/OpenDocument/OpenDocument';
import Content from './pages/Content/Content';

const defaultSettings = {
  theme: 'light',
  colorScheme: 'orange',
  fontFamily: 'Roboto',
  fontSize: '16',
  language: 'ru',
  blurBg: 'noblur',
  bgImage: '',
  invertTextHeader: 'no-inverted',
  scatteringHeader: 'false',
  panelVisible: 'visible',
  borderTable: 'false',
  bgRow: 'false'
};
// Загрузка настроек из localStorage
const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('userSettings'));
    return settings ? settings : defaultSettings;
};

// Применение настроек
const applySettings = (settings) => {
    const main = document.querySelector('.main');

    main.classList.remove('light', 'dark');
    main.classList.add(settings.theme);

    main.classList.remove('orange', 'blue', 'gray');
    main.classList.add(settings.colorScheme);

    main.style.fontFamily = settings.fontFamily;
    main.style.fontSize = settings.fontSize + 'px';

    if (settings.scatteringHeader === 'true') {
      document.querySelector('.main').classList.add('scatt');
    } else {
      document.querySelector('.main').classList.remove('scatt');
    }
};

const App = () => {

  const [settings, setSettings] = useState(loadSettings());
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  return (
    <AuthProvider>
      <div className="main light orange">
        <div className="bg-image">
          {settings.bgImage != '' ? (
            <img
              key={settings.bgImage}
              src={require(`./assets/images/default-bg/${settings.bgImage}.png`)}
              alt=""
            />
          ) 
          : '' }
        </div>
        <div className="scattering"></div>

        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/home' element={<Home />} />
          <Route path='/all_documents/:projectId/:projectName' element={<AllDocuments />} />
          <Route path='/open_document/:documentName' element={<OpenDocument />} />
          <Route path='/settings' element={<Settings settings={settings} setSettings={setSettings} />} />
          <Route path='/content/:projectName' element={<Content />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;