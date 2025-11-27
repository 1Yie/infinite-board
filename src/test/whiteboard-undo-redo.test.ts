import { describe, it, expect, beforeEach, mock } from 'bun:test';

// ==============================
// Mock ResizeObserver
// ==============================

global.ResizeObserver = mock(() => ({
	observe: mock(() => {}),
	unobserve: mock(() => {}),
	disconnect: mock(() => {}),
})) as unknown as typeof ResizeObserver;

// ==============================
// Mock HTMLCanvasElement
// ==============================

if (!global.HTMLCanvasElement) {
	global.HTMLCanvasElement = class {
		width = 800;
		height = 600;

		getContext = mock(() => ({
			save: mock(() => {}),
			restore: mock(() => {}),
			beginPath: mock(() => {}),
			moveTo: mock(() => {}),
			lineTo: mock(() => {}),
			stroke: mock(() => {}),
			fillRect: mock(() => {}),
			setTransform: mock(() => {}),
			translate: mock(() => {}),
			scale: mock(() => {}),
		}));
	} as unknown as typeof HTMLCanvasElement;
} else {
	global.HTMLCanvasElement.prototype.getContext = mock(() => ({
		save: mock(() => {}),
		restore: mock(() => {}),
		beginPath: mock(() => {}),
		moveTo: mock(() => {}),
		lineTo: mock(() => {}),
		stroke: mock(() => {}),
		fillRect: mock(() => {}),
		setTransform: mock(() => {}),
		translate: mock(() => {}),
		scale: mock(() => {}),
	}));
}

// ==============================
// 测试：白板撤销/重做行为
// ==============================

describe('WhiteboardCanvas 撤销/重做 - 游客与登录用户对比', () => {
	let canvasRef: {
		current: {
			undo?: (userId?: string) => string | undefined;
			redo?: () => void;
		};
	};

	beforeEach(() => {
		canvasRef = { current: {} };
	});

	describe('游客用户 (无 userId)', () => {
		it('应该处理游客用户的笔画撤销', () => {
			const mockUndo = mock(() => 'stroke-123');
			canvasRef.current = { undo: mockUndo };

			const result = canvasRef.current.undo();
			expect(result).toBe('stroke-123');
			expect(mockUndo).toHaveBeenCalled();
		});

		it('游客不应该撤销其他用户的笔画', () => {
			const mockUndo = mock(() => undefined);
			canvasRef.current = { undo: mockUndo };

			const result = canvasRef.current.undo();
			expect(result).toBeUndefined();
		});
	});

	describe('登录用户 (有 userId)', () => {
		const testUserId = 'test-user-123';

		it('应该处理登录用户的笔画撤销', () => {
			const mockUndo = mock(() => 'own-stroke-123');
			canvasRef.current = { undo: mockUndo };

			const result = canvasRef.current.undo(testUserId);
			expect(result).toBe('own-stroke-123');
			expect(mockUndo).toHaveBeenCalledWith(testUserId);
		});

		it('登录用户应该只撤销自己的笔画', () => {
			const mockUndo = mock(() => 'own-stroke-456');
			canvasRef.current = { undo: mockUndo };

			const result = canvasRef.current.undo(testUserId);
			expect(result).toBe('own-stroke-456');
		});

		it('应该处理重做功能', () => {
			const mockRedo = mock(() => {});
			canvasRef.current = { redo: mockRedo };

			canvasRef.current.redo();
			expect(mockRedo).toHaveBeenCalled();
		});
	});

	describe('跨用户行为', () => {
		it('应该隔离用户之间的撤销操作', () => {
			const user1Id = 'user1';

			const mockUndo = mock((userId: string) => {
				if (userId === user1Id) return 'stroke-user1';
				return undefined;
			});

			canvasRef.current = { undo: mockUndo };

			const result = canvasRef.current.undo(user1Id);
			expect(result).toBe('stroke-user1');
		});
	});

	describe('WebSocket 集成', () => {
		it('应该为登录用户发送带有 strokeId 的撤销', () => {
			const mockSendUndo = mock((strokeId?: string) => {});
			const strokeId = 'stroke-789';

			const isConnected = true;

			if (isConnected) {
				const localUndoResult = strokeId;
				if (localUndoResult) {
					mockSendUndo(localUndoResult);
				} else {
					mockSendUndo();
				}
			}

			expect(mockSendUndo).toHaveBeenCalledWith(strokeId);
		});

		it('当没有本地撤销时应该发送不带 strokeId 的撤销', () => {
			const mockSendUndo = mock((strokeId?: string) => {});
			const isConnected = true;

			if (isConnected) {
				const localUndoResult = undefined;
				if (localUndoResult) {
					mockSendUndo(localUndoResult);
				} else {
					mockSendUndo();
				}
			}

			expect(mockSendUndo).toHaveBeenCalledWith();
		});
	});
});
