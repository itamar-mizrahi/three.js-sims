import * as THREE from 'three';

export class UIManager {
    private panel: HTMLElement;
    private colorBtns: NodeListOf<Element>;
    private onColorChange: (color: number) => void;

    constructor() {
        this.panel = document.getElementById('properties-panel') as HTMLElement;
        this.colorBtns = document.querySelectorAll('.color-btn');
        this.onColorChange = () => {};

        this.setupEventListeners();
    }

    public setOnColorChange(callback: (color: number) => void) {
        this.onColorChange = callback;
    }

    private setupEventListeners() {
        this.colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const colorHexString = target.getAttribute('data-color');
                
                if (colorHexString) {
                    const colorValue = parseInt(colorHexString);
                    this.onColorChange(colorValue);
                }
            });
        });

        // Prevent clicks on UI from propagating to the scene (handled in main/interaction manager usually, 
        // but good to have a utility or flag here if needed. For now, we just expose the panel).
    }

    public showPanel() {
        this.panel.classList.remove('hidden');
    }

    public hidePanel() {
        this.panel.classList.add('hidden');
    }

    public getPanelElement(): HTMLElement {
        return this.panel;
    }
}
