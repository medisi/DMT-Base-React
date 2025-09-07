import React from 'react';
import './Home_AboutProject.css';

const Home_AboutProject = ( { id, title, stage, kgip, fullTitle, isActive  } ) => {

  return (
        <div
            className={`about_project ${isActive ? 'active' : ''}`}
            id={id}
        >
            <div className="about_project-content">
                <div className="about_project-item">
                    <div className="about_project-item-title">Короткое название</div>
                    <div className="about_project-item-text">{title}</div>
                </div>
                <div className="about_project-item">
                    <div className="about_project-item-title">Стадия</div>
                    <div className="about_project-item-text">{stage}</div>
                </div>
                <div className="about_project-item">
                    <div className="about_project-item-title">КГИП</div>
                    <div className="about_project-item-text">{kgip}</div>
                </div>
                <div className="about_project-item">
                    <div className="about_project-item-title">Полное название</div>
                    <div className="about_project-item-text">{fullTitle}</div>
                </div>
            </div>
        </div>
    );
};

export default Home_AboutProject;
