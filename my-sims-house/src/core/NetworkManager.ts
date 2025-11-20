export interface SavedItem {
    model: string;
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number };
    color: number;
}

export class NetworkManager {
    private readonly API_URL = 'http://localhost:3000/api/room';

    public async saveRoom(data: SavedItem[]): Promise<void> {
        try {
            await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            alert('העיצוב נשמר ב-Redis בהצלחה!');
        } catch (e) {
            console.error(e);
            alert('שגיאה בשמירה לשרת');
        }
    }

    public async loadRoom(): Promise<SavedItem[]> {
        try {
            const response = await fetch(this.API_URL);
            const savedItems: SavedItem[] = await response.json();
            return savedItems || [];
        } catch (e) {
            console.error('Error connecting to backend, loading offline mode...', e);
            return [];
        }
    }
}
