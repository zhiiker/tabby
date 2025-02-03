import { Injectable, NgZone, Inject } from '@angular/core'
import type { Display } from 'electron'
import { ConfigService, DockingService, Screen, PlatformService, BootstrapData, BOOTSTRAP_DATA } from 'tabby-core'
import { ElectronService } from '../services/electron.service'
import { ElectronHostWindow, Bounds } from './hostWindow.service'

@Injectable()
export class ElectronDockingService extends DockingService {
    constructor (
        private electron: ElectronService,
        private config: ConfigService,
        private zone: NgZone,
        private hostWindow: ElectronHostWindow,
        platform: PlatformService,
        @Inject(BOOTSTRAP_DATA) private bootstrapData: BootstrapData,
    ) {
        super()
        this.screensChanged$.subscribe(() => this.repositionWindow())
        platform.displayMetricsChanged$.subscribe(() => this.repositionWindow())

        electron.ipcRenderer.on('host:displays-changed', () => {
            this.zone.run(() => this.screensChanged.next())
        })
    }

    dock (): void {
        const dockSide = this.config.store.appearance.dock

        if (dockSide === 'off' || !this.bootstrapData.isMainWindow) {
            this.hostWindow.setAlwaysOnTop(false)
            return
        }

        let display = this.electron.screen.getAllDisplays()
            .filter(x => x.id === this.config.store.appearance.dockScreen)[0]
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!display) {
            display = this.getCurrentScreen()
        }

        const newBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 }

        const fill = this.config.store.appearance.dockFill <= 1 ? this.config.store.appearance.dockFill : 1
        const space = this.config.store.appearance.dockSpace <= 1 ? this.config.store.appearance.dockSpace : 1
        const [minWidth, minHeight] = this.hostWindow.getWindow().getMinimumSize()

        if (dockSide === 'left' || dockSide === 'right') {
            newBounds.width = Math.max(minWidth, Math.round(fill * display.workArea.width))
            newBounds.height = Math.round(display.workArea.height * space)
        }
        if (dockSide === 'top' || dockSide === 'bottom') {
            newBounds.width = Math.round(display.workArea.width * space)
            newBounds.height = Math.max(minHeight, Math.round(fill * display.workArea.height))
        }
        if (dockSide === 'right') {
            newBounds.x = display.workArea.x + display.workArea.width - newBounds.width
        } else if (dockSide === 'left') {
            newBounds.x = display.workArea.x
        } else {
            newBounds.x = display.workArea.x + Math.round(display.workArea.width / 2 * (1 - space))
        }
        if (dockSide === 'bottom') {
            newBounds.y = display.workArea.y + display.workArea.height - newBounds.height
        } else if (dockSide === 'top') {
            newBounds.y = display.workArea.y
        } else {
            newBounds.y = display.workArea.y + Math.round(display.workArea.height / 2 * (1 - space))
        }

        const alwaysOnTop = this.config.store.appearance.dockAlwaysOnTop

        this.hostWindow.setAlwaysOnTop(alwaysOnTop)
        setImmediate(() => {
            this.hostWindow.setBounds(newBounds)
        })
    }

    getScreens (): Screen[] {
        const primaryDisplayID = this.electron.screen.getPrimaryDisplay().id
        return this.electron.screen.getAllDisplays().sort((a, b) =>
            a.bounds.x === b.bounds.x ? a.bounds.y - b.bounds.y : a.bounds.x - b.bounds.x,
        ).map((display, index) => {
            return {
                ...display,
                id: display.id,
                name: display.id === primaryDisplayID ? 'Primary Display' : `Display ${index + 1}`,
            }
        })
    }

    private getCurrentScreen (): Display {
        return this.electron.screen.getDisplayNearestPoint(this.electron.screen.getCursorScreenPoint())
    }

    private repositionWindow () {
        const [x, y] = this.hostWindow.getWindow().getPosition()
        for (const screen of this.electron.screen.getAllDisplays()) {
            const bounds = screen.bounds
            if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
                return
            }
        }
        const screen = this.electron.screen.getPrimaryDisplay()
        this.hostWindow.getWindow().setPosition(screen.bounds.x, screen.bounds.y)
    }
}
