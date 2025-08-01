class KittenGenerator {
    constructor() {
        this.catWords = null;
        this.catColors = null;
        this.catHistory = [];
        this.currentIndex = -1;
        this.isGenerating = false;
        
        this.initializeElements();
        this.loadData();
        this.bindEvents();
    }
    
    initializeElements() {
        this.catImage = document.getElementById('cat-image');
        this.catPrompt = document.getElementById('cat-prompt');
        this.loading = document.getElementById('loading');
        this.backBtn = document.getElementById('back-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.shareBtn = document.getElementById('share-btn');
        this.currentIndexEl = document.getElementById('current-index');
        this.totalCatsEl = document.getElementById('total-cats');
    }
    
    async loadData() {
        try {
            // Load both cat words and colors
            const [catWordsResponse, colorsResponse] = await Promise.all([
                fetch('cat-words.json'),
                fetch('colors.json')
            ]);
            
            this.catWords = await catWordsResponse.json();
            this.catColors = await colorsResponse.json();
            
            console.log('Cat words loaded:', Object.keys(this.catWords).length, 'categories');
            console.log('Cat colors loaded:', Object.keys(this.catColors).length, 'color categories');
            
            // Generate the first cat
            await this.generateNextCat();
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to basic generation
            await this.generateNextCat();
        }
    }
    
    bindEvents() {
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.downloadBtn.addEventListener('click', () => this.downloadCurrentCat());
        this.shareBtn.addEventListener('click', () => this.shareToComments());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.handleBack();
            } else if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                this.shareToComments();
            } else if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                this.downloadCurrentCat();
            }
        });
    }
    
    generateRandomPrompt() {
        if (!this.catWords) {
            // Fallback prompts - ensure all contain cat/kitten words
            const fallbackPrompts = [
                "adorable fluffy kitten cat",
                "cute orange tabby kitten",
                "playful black and white cat kitten",
                "sleepy grey cat",
                "majestic long-haired kitten cat"
            ];
            return fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
        }
        
        const categories = Object.keys(this.catWords);
        let prompt = "";
        
        // Build a complex prompt using multiple categories
        const usedWords = new Set();
        
        // Add 1-2 adjectives
        if (Math.random() > 0.3) {
            const adjectives = this.catWords.adjectives || [];
            const adj = this.getRandomUnique(adjectives, usedWords);
            if (adj) prompt += adj + " ";
        }
        
        // Add detailed color from colors.json (prioritize this over cat-words colors)
        if (Math.random() > 0.2 && this.catColors) {
            const allColorCategories = Object.values(this.catColors).flat();
            const color = this.getRandomItem(allColorCategories);
            if (color) prompt += color + " ";
        } else if (Math.random() > 0.4) {
            // Fallback to original colors/patterns if colors.json not loaded
            const colors = this.catWords.colors || [];
            const patterns = this.catWords.patterns || [];
            const colorPattern = [...colors, ...patterns];
            const color = this.getRandomUnique(colorPattern, usedWords);
            if (color) prompt += color + " ";
        }
        
        // Add breed or type
        if (Math.random() > 0.6) {
            const breeds = this.catWords.breeds || [];
            const breed = this.getRandomUnique(breeds, usedWords);
            if (breed) prompt += breed + " ";
        }
        
        // ALWAYS add base cat/kitten - this is mandatory
        const bases = this.catWords.bases || ["cat", "kitten", "kitty", "feline"];
        const primaryBase = this.getRandomItem(bases);
        prompt += primaryBase + " ";
        
        // Occasionally add a second cat-related word for emphasis
        if (Math.random() > 0.7) {
            const secondaryBase = this.getRandomItem(bases.filter(base => base !== primaryBase));
            if (secondaryBase) prompt += secondaryBase + " ";
        }
        
        // Add pose/action
        if (Math.random() > 0.5) {
            const poses = this.catWords.poses || [];
            const pose = this.getRandomUnique(poses, usedWords);
            if (pose) prompt += pose + " ";
        }
        
        // Add environment
        if (Math.random() > 0.7) {
            const environments = this.catWords.environments || [];
            const env = this.getRandomUnique(environments, usedWords);
            if (env) prompt += "in " + env + " ";
        }
        
        // Add style
        if (Math.random() > 0.8) {
            const styles = this.catWords.styles || [];
            const style = this.getRandomUnique(styles, usedWords);
            if (style) prompt += ", " + style + " style";
        }
        
        return prompt.trim();
    }
    
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    getRandomUnique(array, usedSet) {
        const available = array.filter(item => !usedSet.has(item));
        if (available.length === 0) return null;
        
        const selected = this.getRandomItem(available);
        usedSet.add(selected);
        return selected;
    }
    
    async handleNext() {
        if (this.currentIndex < this.catHistory.length - 1) {
            // Navigate to existing cat
            this.currentIndex++;
            this.displayCat(this.catHistory[this.currentIndex]);
        } else {
            // Generate new cat
            await this.generateNextCat();
        }
        this.updateControls();
    }
    
    handleBack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCat(this.catHistory[this.currentIndex]);
            this.updateControls();
        }
    }
    
    async generateNextCat() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.showLoading();
        
        try {
            const prompt = this.generateRandomPrompt();
            console.log('Generating cat with prompt:', prompt);
            
            const result = await websim.imageGen({
                prompt: prompt + ", high quality, detailed, cute, photorealistic",
                aspect_ratio: "1:1"
            });
            
            const catData = {
                url: result.url,
                prompt: prompt,
                timestamp: Date.now()
            };
            
            this.catHistory.push(catData);
            this.currentIndex = this.catHistory.length - 1;
            
            this.displayCat(catData);
            this.updateControls();
            
        } catch (error) {
            console.error('Error generating cat:', error);
            alert('Failed to generate cat. Please try again!');
        } finally {
            this.isGenerating = false;
            this.hideLoading();
        }
    }
    
    displayCat(catData) {
        this.catImage.src = catData.url;
        this.catPrompt.textContent = catData.prompt;
        this.catImage.classList.add('fade-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.catImage.classList.remove('fade-in');
        }, 500);
    }
    
    updateControls() {
        this.backBtn.disabled = this.currentIndex <= 0;
        this.currentIndexEl.textContent = this.currentIndex + 1;
        this.totalCatsEl.textContent = this.catHistory.length;
        
        // Update next button text
        if (this.currentIndex < this.catHistory.length - 1) {
            this.nextBtn.innerHTML = 'Next <span>→</span>';
        } else {
            this.nextBtn.innerHTML = 'Generate <span>✨</span>';
        }
    }
    
    async downloadCurrentCat() {
        if (!this.catHistory[this.currentIndex]) return;
        
        try {
            const catData = this.catHistory[this.currentIndex];
            const response = await fetch(catData.url);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kitten-${this.currentIndex + 1}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('Cat downloaded successfully');
        } catch (error) {
            console.error('Error downloading cat:', error);
            alert('Failed to download cat. Please try again!');
        }
    }
    
    async shareToComments() {
        if (!this.catHistory[this.currentIndex]) return;
        
        try {
            const catData = this.catHistory[this.currentIndex];
            
            const result = await window.websim.postComment({
                content: `Check out this adorable generated kitten! 🐱\n\nPrompt: "${catData.prompt}"`,
                images: [catData.url]
            });
            
            if (result.error) {
                alert('Failed to share cat: ' + result.error);
            } else {
                console.log('Cat shared to comments successfully');
                // Show success feedback
                this.shareBtn.textContent = '✅ Shared!';
                setTimeout(() => {
                    this.shareBtn.innerHTML = '💬 Share to Comments';
                }, 2000);
            }
        } catch (error) {
            console.error('Error sharing cat:', error);
            alert('Failed to share cat to comments. Please try again!');
        }
    }
    
    showLoading() {
        this.loading.classList.remove('hidden');
        this.nextBtn.disabled = true;
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
        this.nextBtn.disabled = false;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KittenGenerator();
});