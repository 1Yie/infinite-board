// bun-test.d.ts

// 这里提供 bun test 环境缺失的 DOM 类型补丁
declare global {
	// ResizeObserver Stub
	interface ResizeObserver {
		observe: (target?: Element) => void;
		unobserve: (target?: Element) => void;
		disconnect: () => void;
	}

	var ResizeObserver: {
		new (...args: Element[]): ResizeObserver;
	};

	// HTMLCanvasElement stub，用于测试环境
	interface HTMLCanvasElement {
		width: number;
		height: number;
		getContext: (type?: string) => CanvasRenderingContext2D | null;
	}

	// 解决 global 对象缺少类型
	// bun 在 test 环境中使用 globalThis，但 TS 类型里缺，因此补充
	const global: typeof globalThis;
}

export {};
