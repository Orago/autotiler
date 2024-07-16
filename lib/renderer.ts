import BrushCanvas from '@orago/game/brush';
import Engine from '@orago/game/engine';
import { body } from './dom';

export const brush = new BrushCanvas().resizable();

body.append(brush.canvas);

export const engine = new Engine(brush);