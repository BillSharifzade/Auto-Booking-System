import React from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    return (
        <header className="bg-primary-dark text-white px-4 py-4 safe-area-top">
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
        </header>
    );
};

export default Header;
