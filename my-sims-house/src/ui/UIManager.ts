import * as THREE from 'three';

export class UIManager {
    private panel: HTMLElement;
    private colorBtns: NodeListOf<Element>;
    private deleteBtn: HTMLElement | null;
    private onColorChange: (color: number) => void;
    private onDelete: () => void;

    constructor() {
        this.panel = document.getElementById('properties-panel') as HTMLElement;
        this.colorBtns = document.querySelectorAll('.color-btn');
        this.deleteBtn = document.getElementById('delete-btn');
        
        this.onColorChange = () => {};
        this.onDelete = () => {};

        this.setupEventListeners();
    }

    public setOnColorChange(callback: (color: number) => void) {
        this.onColorChange = callback;
    }

    public setOnDelete(callback: () => void) {
        this.onDelete = callback;
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

        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', () => {
                this.onDelete();
            });
        }
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
