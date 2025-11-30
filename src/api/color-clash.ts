import { client } from './client';
import { colorClashWsApi, type ColorClashDrawMessage } from './ws/color-clash';

// 颜色对抗游戏状态类型定义
export interface ColorClashGameState {
	mode: 'color-clash';
	isActive: boolean;
	gameStartTime: number | null;
	gameTimeLimit: number;
	players: ColorClashPlayer[];
	canvasWidth: number;
	canvasHeight: number;
	colorData: Uint8ClampedArray | null; // RGBA数据
	winner: string | null;
	gameEndTime: number | null;
	room?: ColorClashRoom; // 添加房间信息
}

export interface ColorClashPlayer {
	userId: string;
	username: string;
	color: string; // RGB颜色字符串，如 "rgb(255,0,0)"
	score: number; // 占领的像素数量
	isConnected: boolean;
	lastActivity: number;
	x?: number; // 玩家在画布上的X坐标
	y?: number; // 玩家在画布上的Y坐标
}

export interface ColorClashRoom {
	id: string;
	name: string;
	ownerId: string;
	ownerName: string;
	maxPlayers: number;
	currentPlayers: number;
	gameTime: number; // 游戏时长（秒）
	canvasWidth: number;
	canvasHeight: number;
	isPrivate: boolean | null;
	status: 'waiting' | 'playing' | 'finished';
	createdAt: Date | null;
}

export interface CreateColorClashRoomRequest {
	name: string;
	maxPlayers: number;
	gameTime: number;
	canvasWidth: number;
	canvasHeight: number;
	isPrivate: boolean;
	password?: string;
}

export interface JoinColorClashRoomRequest {
	roomId: string;
	password?: string;
}

export interface ColorClashDrawData {
	x: number;
	y: number;
	color: string;
	size: number;
}

// WebSocket 消息类型 (服务器消息)
export type ColorClashServerMessage =
	| { type: 'room-joined'; room: ColorClashRoom; players: ColorClashPlayer[] }
	| { type: 'player-joined'; player: ColorClashPlayer }
	| { type: 'player-left'; userId: string }
	| { type: 'game-started'; gameState: ColorClashGameState }
	| { type: 'draw-update'; data: ColorClashDrawData; userId: string }
	| {
			type: 'game-ended';
			winner: ColorClashPlayer;
			finalScores: ColorClashPlayer[];
	  }
	| { type: 'score-update'; scores: { userId: string; score: number }[] }
	| {
			type: 'game-chat';
			message: string;
			username: string;
			timestamp: number;
			id?: string;
	  }
	| { type: 'game-state'; data: ColorClashGameState; timestamp: number }
	| { type: 'error'; message: string }
	| { type: 'pong' }
	| { type: 'owner-changed'; newOwnerId: string; newOwnerName: string };

export const colorClashApi = {
	/**
	 * 获取房间列表
	 */
	getRooms: async () => {
		const { data, error } = await client.api['color-clash'].rooms.get();

		if (error) {
			throw new Error(error.value?.toString() || '获取房间列表失败');
		}

		return data;
	},

	/**
	 * 创建房间
	 */
	createRoom: async (data: CreateColorClashRoomRequest) => {
		const { data: response, error } =
			await client.api['color-clash'].rooms.post(data);

		if (error) {
			throw new Error(error.value?.toString() || '创建房间失败');
		}

		return response;
	},

	/**
	 * 加入房间
	 */
	joinRoom: async (roomId: string, password?: string) => {
		const { data, error } = await client.api['color-clash']({
			roomId,
		}).join.post({
			password,
		});

		if (error) {
			throw new Error(error.value?.toString() || '加入房间失败');
		}

		return data;
	},

	/**
	 * 获取房间详情
	 */
	getRoom: async (roomId: string) => {
		const { data, error } = await client.api['color-clash']({ roomId }).get();

		if (error) {
			throw new Error(error.value?.toString() || '获取房间详情失败');
		}

		return data;
	},
};

export { colorClashWsApi };
export type { ColorClashDrawMessage };
