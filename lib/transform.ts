import { Position2D, Vector2 } from '@orago/vector';

export function screenToWorld(
	screen: Position2D,
	options?: {
		center?: Position2D;
		offset?: Position2D;
		zoom?: number
	}
): Vector2 {
	const center = options?.center ?? { x: 0, y: 0 };
	const offset = options?.offset ?? { x: 0, y: 0 };
	const zoom = options?.zoom ?? 1;

	return new Vector2(
		(screen.x - offset.x) * zoom + center.x,
		(screen.y - offset.y) * zoom + center.y
	);
}

export function worldToScreen(
	world: Position2D,
	options?: {
		center?: Position2D;
		offset?: Position2D;
		zoom?: number
	}
): Vector2 {
	const center = options?.center ?? { x: 0, y: 0 };
	const offset = options?.offset ?? { x: 0, y: 0 };
	const zoom = options?.zoom ?? 1;

	return new Vector2(
		(world.x + offset.x) * zoom + (center.x / zoom),
		(world.y + offset.y) * zoom + (center.y / zoom)
	);
}

export function screenToGrid(
	screen: Position2D,
	blockSize: number,
	options?: {
		center?: Position2D;
		offset?: Position2D;
		zoom?: number;
	}
): Position2D {
	const zoom = options?.zoom ?? 1;

	// Convert screen to world coordinates
	const worldPos = screenToWorld(screen, options);

	// Calculate grid position
	const gridX = Math.floor(worldPos.x / blockSize / zoom / zoom);
	const gridY = Math.floor(worldPos.y / blockSize / zoom / zoom);

	return { x: gridX, y: gridY };
}