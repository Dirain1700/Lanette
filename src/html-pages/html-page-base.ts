import type { Room } from "../rooms";
import type { User } from "../users";
import type { ComponentBase } from "./components/component-base";

export abstract class HtmlPageBase {
	abstract pageId: string;

	closed: boolean = false;
	components: ComponentBase[] = [];
	lastRender: string = '';

	baseCommand: string;
	commandPrefix: string;
	pageList: Dict<HtmlPageBase>;
	room: Room;

	isRoomStaff!: boolean;
	userName!: string;
	userId!: string;

	constructor(room: Room, user: User, baseCommand: string, pageList: Dict<HtmlPageBase>) {
		this.room = room;
		this.baseCommand = baseCommand;
		this.commandPrefix = Config.commandCharacter + baseCommand + " " + room.id;
		this.pageList = pageList;

		this.setUser(user);

		if (user.id in pageList) pageList[user.id].destroy();
		pageList[user.id] = this;
	}

	abstract render(onOpen?: boolean): string;

	destroy(): void {
		for (const component of this.components) {
			component.destroy();
		}

		delete this.pageList[this.userId];

		this.closed = true;
		Tools.unrefProperties(this, ['closed', 'pageId', 'userName', 'userId']);
	}

	open(): void {
		this.send(true);
	}

	close(): void {
		if (this.closed) throw new Error(this.pageId + " page already closed for user " + this.userId);

		const user = Users.get(this.userId);
		if (user) this.room.closeHtmlPage(user, this.pageId);

		if (this.onClose) this.onClose();
		this.destroy();
	}

	setUser(user: User): void {
		this.userName = user.name;
		this.userId = user.id;
		this.isRoomStaff = user.hasRank(this.room, 'driver') || user.isDeveloper();
	}

	onRenameUser(user: User, oldId: string): void {
		if (!(oldId in this.pageList)) return;

		if (oldId === user.id) {
			this.userName = user.name;
			return;
		}

		if (user.id in this.pageList) {
			this.pageList[oldId].destroy();
		} else {
			this.setUser(user);
			this.pageList[user.id] = this;
		}

		delete this.pageList[oldId];
	}

	send(onOpen?: boolean): void {
		if (this.closed) return;

		if (this.beforeSend && !this.beforeSend(onOpen)) return;

		const user = Users.get(this.userId);
		if (!user) return;

		const render = this.render(onOpen);
		if (render === this.lastRender) return;

		this.lastRender = render;
		this.room.sendHtmlPage(user, this.pageId, render);

		if (this.onSend) this.onSend(onOpen);
	}

	checkComponentCommands(componentCommand: string, targets: readonly string[]): string | undefined {
		for (const component of this.components) {
			if (component.active && component.componentCommand === componentCommand) {
				return component.tryCommand(targets);
			}
		}

		return "Unknown sub-command '" + componentCommand + "'.";
	}

	getQuietPmButton(message: string, label: string, disabled?: boolean, buttonStyle?: string): string {
		return Client.getQuietPmButton(this.room, message, label, disabled, buttonStyle);
	}

	beforeSend?(onOpen?: boolean): boolean;
	onClose?(): void;
	onOpen?(): void;
	onSend?(onOpen?: boolean): void;
}
