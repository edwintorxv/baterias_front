import { Injectable, signal } from '@angular/core';

export type Tema = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {

    readonly tema = signal<Tema>('light');

    setTheme(mode: Tema): void {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        localStorage.setItem('app-theme', mode);
        this.tema.set(mode);
    }

    toggle(): void {
        this.setTheme(this.tema() === 'dark' ? 'light' : 'dark');
    }

    loadTheme(): void {
        const saved = (localStorage.getItem('app-theme') as Tema) || 'light';
        this.setTheme(saved);
    }

}
