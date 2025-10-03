import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, signal, ViewChild } from '@angular/core';

declare global {
  interface Window { _fwn?: any; }
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class App implements AfterViewInit, OnDestroy{

   @ViewChild('storyblock', { read: ElementRef }) storyblockRef!: ElementRef<HTMLElement>;
  @ViewChild('liveSection', { read: ElementRef }) liveSectionRef!: ElementRef<HTMLElement>;

  private observer!: IntersectionObserver;
  pipActive = false;
  playerReady = false;

  private joinHandler = (e: Event) => console.log("User joined livestream", e);
  private quitHandler = (e: Event) => console.log("User left livestream", e);

  // Access player by name
  get player() {
    return window._fwn?.players?.['my-storyblock'];
  }

  ngAfterViewInit(): void {
    const el = this.storyblockRef?.nativeElement;

    if (el) {
      el.addEventListener('fw:livestream:join', this.joinHandler);
      el.addEventListener('fw:livestream:quit', this.quitHandler);
    }

    // Poll Firework SDK readiness
    const poll = setInterval(() => {
      if (this.player) {
        clearInterval(poll);
        console.log("✅ Firework player ready");

        // Enable PIP for this storyblock
        this.player.enablePip?.(el);
        this.playerReady = true;

        // Setup scroll observer
        this.setupScrollObserver();
      }
    }, 500);
  }

  setupScrollObserver() {
    if (!this.liveSectionRef) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!this.player) return;

        if (entry.isIntersecting) {
          if (!this.pipActive) this.player.setPip(false); // visible → normal
        } else {
          if (!this.pipActive) this.player.setPip(true);  // scrolled away → PIP
        }
      });
    }, { threshold: 0.25 });

    this.observer.observe(this.liveSectionRef.nativeElement);
  }

  togglePip() {
    if (!this.player || !this.playerReady) {
      console.log("Player not ready yet!");
      return;
    }

    this.pipActive = !this.pipActive;

    if (this.pipActive) {
      this.player.minimize();       // make current player
      this.player.setPip(true);
    } else {
      this.player.setPip(false);
    }
  }

  fullscreen() { this.player?.fullscreen(); }

  restart() { if (this.player) this.player.currentTime = 0; }

  ngOnDestroy(): void {
    const el = this.storyblockRef?.nativeElement;
    if (el) {
      el.removeEventListener('fw:livestream:join', this.joinHandler);
      el.removeEventListener('fw:livestream:quit', this.quitHandler);
    }

    if (this.observer && this.liveSectionRef) {
      this.observer.unobserve(this.liveSectionRef.nativeElement);
    }
  }

}