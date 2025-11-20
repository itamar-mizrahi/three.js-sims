import * as THREE from 'three';

export class UIManager {
    private propertiesPanel: HTMLElement;
    private deleteBtn: HTMLElement | null;
    
    private onColorChange: ((color: number) => void) | null = null;
    private onDelete: (() => void) | null = null;
    private onRotateLeft: (() => void) | null = null;
    private onRotateRight: (() => void) | null = null;

    constructor() {
        this.propertiesPanel = document.getElementById('properties-panel') as HTMLElement;
        this.deleteBtn = document.getElementById('delete-btn');
        
        this.setupEventListeners();
    }

    public setOnColorChange(callback: (color: number) => void) {
        this.onColorChange = callback;
    }

    public setOnDelete(callback: () => void) {
        this.onDelete = callback;
    }

    public setOnRotateLeft(callback: () => void) {
        this.onRotateLeft = callback;
    }

    public setOnRotateRight(callback: () => void) {
        this.onRotateRight = callback;
    }

    private setupEventListeners() {
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const colorHexString = target.getAttribute('data-color');
                if (colorHexString && this.onColorChange) {
                    this.onColorChange(parseInt(colorHexString));
                }
            });
        });

        // Delete button
        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', () => {
                if (this.onDelete) this.onDelete();
            });
        }

        // Rotate buttons
        const rotateLeftBtn = document.getElementById('rotate-left-btn');
        const rotateRightBtn = document.getElementById('rotate-right-btn');

        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => {
                if (this.onRotateLeft) this.onRotateLeft();
            });
        }

        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => {
                if (this.onRotateRight) this.onRotateRight();
            });
        }
    }

    public showPanel() {
        this.propertiesPanel.classList.remove('hidden');
        this.propertiesPanel.classList.add('visible');
    }

    public hidePanel() {
        this.propertiesPanel.classList.remove('visible');
        this.propertiesPanel.classList.add('hidden');
    }

    public getPanelElement(): HTMLElement {
        return this.propertiesPanel;
    }
}
