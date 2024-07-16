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

class PanningPlugin extends EngineObject {
	start = { x: 0, y: 0 };
	offset = { x: 0, y: 0 };
	change = { x: 0, y: 0 };
	state?: boolean = false;

	constructor(engine: Engine) {
		super(engine);

		const { cursor } = engine;

		cursor.events.on('move', () => {
			if (engine.keyboard.isPressed(' ')) {
				this.move();


			}
			else if (this.state) {
				this.state = false;
				this.reset();
			}
		});
	}

	move() {
		const { cursor } = engine;

		if (this.state != true) {
			this.state = true;

			this.start = {
				x: cursor.pos.x,
				y: cursor.pos.y
			}
		}

		this.change.x = cursor.pos.x - this.start.x;
		this.change.y = cursor.pos.y - this.start.y;

		engine.offset.x = (this.offset.x + this.change.x);
		engine.offset.y = (this.offset.y + this.change.y);
	}

	reset() {
		this.offset.x += this.change.x;
		this.offset.y += this.change.y;
		engine.offset.x = this.offset.x;
		engine.offset.y = this.offset.y;
		this.change.x = 0;
		this.change.y = 0;
	}
}

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
				// const pos = engine.screenToWorld(engine.cursor.pos);
				const k = {
					x: cursor.pos.x / baseTileSize,
					y: cursor.pos.y / baseTileSize
				}

				const scaled = screenToGrid(cursor.pos, baseTileSize, { offset: engine.offset, zoom: engine.zoom });

				// const scaled = {
				// 	x: (cursor.pos.x - engine.offset.x) / baseTileSize / engine.zoom,
				// 	y: (cursor.pos.y - engine.offset.y) / baseTileSize / engine.zoom
				// }

				this.setAt(
					scaled.x | 0,
					scaled.y | 0,
					0
				);
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

	setAt(x: number, y: number, tile: number) {
		this.tiles.set({ x, y }, tile);
	}

	getAt(x: number, y: number) {
		return this.tiles.get({ x, y });
	}
}

class ZoomHandler extends EngineObject {
	constructor(engine: Engine) {
		super(engine);

		this.engine.brush.canvas.addEventListener('wheel', this.handleWheel.bind(this));
	}

	private handleWheel(event: WheelEvent) {
		const zoomIntensity = 0.1;
		const zoom = 1 + (event.deltaY > 0 ? -zoomIntensity : zoomIntensity);

		const mouseX = this.engine.cursor.pos.x;
		const mouseY = this.engine.cursor.pos.y;

		this.zoom2(zoom, event.deltaY);
		event.preventDefault();
	}

	private zoom2(zoom: number, deltaY: number) {
		const { offset } = this.engine;
		const pos = this.engine.cursor.pos;
		const npos = {
			x: pos.x,
			y: pos.y
		}

		// Calculate the cursor position in world coordinates before zooming
		const before = screenToWorld(npos, {
			zoom: 1,
			offset: offset,
		});

		// Adjust the zoom level based on the scroll event
		const zoomFactor = 1.1;
		const g = deltaY < 0 ? zoomFactor : 1 / zoomFactor;

		this.engine.zoom *= g;

		// Calculate the cursor position in world coordinates after zooming
		const after = screenToWorld(npos, {
			zoom: g,
			offset: offset,
		});

		// Calculate the difference in world coordinates
		const dx = before.x - after.x;
		const dy = before.y - after.y;

		// Adjust the center by this difference to keep the cursor in the same position
		this.engine.offset.x += dx;
		this.engine.offset.y += dy;
	}

	private zoom(mouseX: number, mouseY: number, zoom: number) {
		const { offset } = this.engine;
		const pos = this.engine.cursor.pos;
		const worldMouse = screenToWorld(pos, { offset, zoom: this.engine.zoom });

		this.engine.zoom *= zoom;

		const newWorldMouse = screenToWorld(pos, { offset, zoom: this.engine.zoom });

		this.engine.offset.x += worldMouse.x - newWorldMouse.x;
		this.engine.offset.y += worldMouse.y - newWorldMouse.y;
	}
}

new PanningPlugin(engine).addTo();
new ZoomHandler(engine).addTo();
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