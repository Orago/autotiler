import { brush, engine } from './renderer';
import './css/main.css';
import Sprites from '@orago/game/sprites';
import Engine, { EngineObject } from '@orago/game/engine';
import { AutotilingMaster } from './autotilingManager';
import { drawGridBackground } from './gridBackground';
import { Position2D, Vector2, Vector2Map } from '@orago/vector';
import { screenToGrid, screenToWorld, worldToScreen } from './transform';

const sprites = new Sprites({ host: '/sprites/' });
const tileset = sprites.get('/demo-set.png');
const baseTileSize = 32;

class TextEntity extends EngineObject {
	fontSize = 20;
	text: string = '';

	x = 50;
	y = 50;

	constructor(engine: Engine) {
		super(engine);

		this.addTo();

		this.events.on('click', () => {
			console.log('i\'ve been clicked');
		});


		this.events.on('render', () => {
			// this.render()
			this.setText(this.width + '');

		});
	}

	render() {

		brush.chainable
			.save
			.pos(this.x, this.y)
			.color('red')
			.rect
			.text(this.text)
			.restore;
	}

	setText(value: string) {
		this.text = value;

		this.height = this.fontSize;
		this.engine.brush.chainable.generatedFont({
			size: this.fontSize
		});
		this.render();
		this.width = this.engine.brush.chainable.textWidth(this.text);

		return this;
	}
}


class World extends EngineObject {
	tiles: Vector2Map<number> = new Vector2Map();

	constructor(engine: Engine) {
		super(engine);

		const { cursor } = engine;

		cursor.events.on('move', () => {
			if (cursor.down) {
				const scaled = screenToGrid(cursor.pos, baseTileSize, { offset: engine.offset, zoom: engine.zoom });

				if (cursor.button == 0) {
					this.tiles.set(scaled, 0);
				}
				else if (cursor.button == 2) {
					this.tiles.delete(scaled);
				}
			}
		});

		this.events.on('render', () => {
			const tileSize = baseTileSize * engine.zoom;

			for (const [vector, tile] of this.tiles.entries()) {

				brush.chainable
					.pos(
						vector.x * tileSize + engine.offset.x,
						vector.y * tileSize + engine.offset.y,
					)
					.size(tileSize)
					.color('green')
					.rect
			}
		});
	}
}

class PanAndZoomHandler extends EngineObject {
	modes = {
		panning: false,
		zoom: false
	};

	pan = {
		start: { x: 0, y: 0 },
		offset: { x: 0, y: 0 },
		change: { x: 0, y: 0 },
		state: false,
		active: false
	};

	constructor(engine: Engine) {
		super(engine);

		this.engine.brush.canvas.addEventListener('wheel', this.handleWheel.bind(this));

		const { cursor } = engine;

		cursor.events.on('move', () => this.panTick());
		cursor.events.on('middle', () => this.pan.active = true);
		cursor.events.on('middle-release', () => this.pan.active = false);
	}

	toggleModes(status: boolean, modes: (keyof typeof this.modes)[]) {
		for (const mode of modes) {
			this.modes[mode] = status;
		}

		return this;
	}

	private handleWheel(event: WheelEvent) {
		if (this.modes.panning != true) return;

		const { deltaY } = event;

		const { offset } = this.engine;
		const pos = this.engine.cursor.pos;
		const npos = {
			x: pos.x,
			y: pos.y
		}

		const before = screenToWorld(npos, {
			zoom: 1,
			offset
		});

		const zoomFactor = 1.1;
		const g = deltaY < 0 ? zoomFactor : 1 / zoomFactor;

		this.engine.zoom *= g;

		const after = screenToWorld(npos, {
			zoom: g,
			offset
		});

		this.engine.offset.x += before.x - after.x;
		this.engine.offset.y += before.y - after.y;

		event.preventDefault();
	}

	panTick() {
		if (this.modes.panning != true) return;

		if (this.pan.active)
			this.panMove();

		else if (this.pan.state)
			this.panReset();
	}

	panMove() {
		const { cursor } = engine;

		if (this.pan.state != true) {
			this.pan.state = true;

			this.pan.start = {
				x: cursor.pos.x,
				y: cursor.pos.y
			}
		}

		this.pan.change.x = cursor.pos.x - this.pan.start.x;
		this.pan.change.y = cursor.pos.y - this.pan.start.y;

		engine.offset.x = (this.pan.offset.x + this.pan.change.x);
		engine.offset.y = (this.pan.offset.y + this.pan.change.y);
	}

	panReset() {
		this.pan.state = false;

		this.pan.offset.x += this.pan.change.x;
		this.pan.offset.y += this.pan.change.y;
		engine.offset.x = this.pan.offset.x;
		engine.offset.y = this.pan.offset.y;
		this.pan.change.x = 0;
		this.pan.change.y = 0;
	}
}

new PanAndZoomHandler(engine).addTo().toggleModes(true, ['zoom', 'panning']);
new World(engine).addTo();


engine.object({ priority: 0 }, ref => {
	ref.addTo();
	engine.keyboard.init();

	ref.events.on('render', () => {
		brush.clear();

		drawGridBackground(engine, {
			size: baseTileSize * engine.zoom,
			offset: engine.offset
		});

		brush.chainable
			.pos(engine.offset.x + 50 * engine.zoom, engine.offset.y + 50 * engine.zoom)
			.size(tileset.width * engine.zoom, tileset.height * engine.zoom)
			.image(tileset)
	});
});