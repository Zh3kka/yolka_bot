import { Update, Start, On, Ctx, Action } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { SessionService } from "./session.service";
import { BotService } from "./bot.service";
import { SessionStep } from "../shared/types/session.types";
import { ParticipationStatus } from "../shared/types/registration.types";

interface TelegrafContext extends Context {
  update: Context["update"] & {
    callback_query?: {
      data?: string;
    };
  };
}

const MESSAGES = {
  WELCOME: `Привет! 26 декабря в 19:00 приглашаем Вас на душевный новогодний утренник - с ностальгией, улыбками и настоящей сказкой ❄️🎄✨ 

Пожалуйста, подтвердите участие 🙌`,
  ASK_NAME: "Пожалуйста, напишите своё имя и фамилию:",
  ASK_GUESTS_COUNT: "Сколько гостей вы планируете привести?",
  ASK_GUEST_NAME: (index: number) => `Напишите имя гостя #${index + 1}:`,
  ASK_CHILDREN_COUNT: "Сколько детей придёт с вами?",
  ASK_CHILD_NAME: (index: number) => `Напишите имя ребёнка #${index + 1}:`,
  ASK_CHILD_AGE: (name: string) => `Сколько лет ${name}?`,
  ASK_PERFORMANCE: `🎁 Каждый ребёнок получит подарок от Деда Мороза!

Также ребёнок может подготовить небольшой номер для выступления (песня, стихотворение, танец, всё что угодно).

Если ваш ребёнок хочет выступить, нажмите «Готовит номер». Если нет — «Пропустить».`,
  ASK_PERFORMANCE_DESC:
    "Опишите, какой номер подготовит ребёнок (стих/танец/песня/поделка/что угодно):",
  ASK_PHOTOS: `Отправьте, пожалуйста, СВОЁ фото из детского сада и одно актуальное фото.

Мы сделаем тёплую новогоднюю подборку: посмотрим, какими мы были на утренниках в детстве — и какими классными стали сейчас.

Ваши снимки помогут создать ту самую атмосферу ностальгии и волшебства, без которой не обходится ни один настоящий утренник. 🎄✨

⚠️ Отправляйте по ОДНОЙ фотографии за раз!

Сначала отправьте СВОЁ детское фото:`,
  ASK_CURRENT_PHOTO: "⚠️ Отправьте ОДНУ актуальную фотографию СЕБЯ:",
  PHOTO_ERROR:
    "⚠️ Пожалуйста, отправьте только ОДНУ фотографию, не несколько сразу!",
  CONFIRM_SOLO: `Спасибо! Ты в списке участников ❤️ 
Будем ждать тебя 26 декабря в 19:00 в офисе по адресу Остоженка 37/7 стр.2, этаж 5. 
До встречи 🥰`,
  CONFIRM_GROUP: `Отлично! Вы в списке участников ❤️ 
Будем ждать вас 26 декабря в 19:00 в офисе по адресу Остоженка 37/7 стр.2, этаж 5. 
До встречи 🥰`,
  DECLINED: `Очень жаль, что у тебя не получится 😔 
Будем ждать тебя в следующий раз и с Наступающим Новым Годом!🥰`,
};

@Update()
export class BotUpdate {
  constructor(
    private sessionService: SessionService,
    private botService: BotService
  ) {}

  @Start()
  async onStart(@Ctx() ctx: TelegrafContext): Promise<void> {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || "unknown";

    if (!telegramId) return;

    this.sessionService.resetSession(telegramId, username);

    await ctx.reply(
      MESSAGES.WELCOME,
      Markup.inlineKeyboard([
        [Markup.button.callback("Пойду", "action_going")],
        [Markup.button.callback("Пойду с гостем/гостями", "action_with_guest")],
        [Markup.button.callback("Пойду с ребёнком", "action_with_child")],
        [Markup.button.callback("Не смогу прийти", "action_declined")],
      ])
    );
  }

  @Action("action_going")
  async onGoing(@Ctx() ctx: TelegrafContext): Promise<void> {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );
    session.status = ParticipationStatus.GOING;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_NAME);

    await ctx.reply(MESSAGES.ASK_NAME);
  }

  @Action("action_with_guest")
  async onWithGuest(@Ctx() ctx: TelegrafContext): Promise<void> {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );
    session.status = ParticipationStatus.WITH_GUEST;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_NAME);

    await ctx.reply(MESSAGES.ASK_NAME);
  }

  @Action("action_with_child")
  async onWithChild(@Ctx() ctx: TelegrafContext): Promise<void> {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );
    session.status = ParticipationStatus.WITH_CHILD;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_NAME);

    await ctx.reply(MESSAGES.ASK_NAME);
  }

  @Action("action_declined")
  async onDeclined(@Ctx() ctx: TelegrafContext): Promise<void> {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );
    session.status = ParticipationStatus.DECLINED;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_NAME);

    await ctx.reply(MESSAGES.ASK_NAME);
  }

  @Action("performance_yes")
  async onPerformanceYes(@Ctx() ctx: TelegrafContext): Promise<void> {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    this.sessionService.setStep(
      telegramId,
      SessionStep.AWAITING_PERFORMANCE_DESCRIPTION
    );
    await ctx.reply(MESSAGES.ASK_PERFORMANCE_DESC);
  }

  @Action("performance_no")
  async onPerformanceNo(@Ctx() ctx: TelegrafContext): Promise<void> {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );

    const currentChild = session.childrenData[session.currentChildIndex];
    if (currentChild) {
      currentChild.hasPerformance = false;
    }

    session.currentChildIndex++;

    if (session.currentChildIndex < (session.childrenCount || 0)) {
      this.sessionService.setStep(telegramId, SessionStep.AWAITING_CHILD_NAME);
      await ctx.reply(MESSAGES.ASK_CHILD_NAME(session.currentChildIndex));
      return;
    }

    this.sessionService.setStep(
      telegramId,
      SessionStep.AWAITING_CHILDHOOD_PHOTO
    );
    await ctx.reply(MESSAGES.ASK_PHOTOS);
  }

  @On("text")
  async onText(@Ctx() ctx: TelegrafContext): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const message = ctx.message;
    if (!message || !("text" in message)) return;

    const text = message.text;
    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );

    switch (session.step) {
      case SessionStep.AWAITING_NAME:
        await this.handleName(ctx, session, text);
        break;
      case SessionStep.AWAITING_GUESTS_COUNT:
        await this.handleGuestsCount(ctx, session, text);
        break;
      case SessionStep.AWAITING_GUEST_NAME:
        await this.handleGuestName(ctx, session, text);
        break;
      case SessionStep.AWAITING_CHILDREN_COUNT:
        await this.handleChildrenCount(ctx, session, text);
        break;
      case SessionStep.AWAITING_CHILD_NAME:
        await this.handleChildName(ctx, session, text);
        break;
      case SessionStep.AWAITING_CHILD_AGE:
        await this.handleChildAge(ctx, session, text);
        break;
      case SessionStep.AWAITING_PERFORMANCE_DESCRIPTION:
        await this.handlePerformanceDescription(ctx, session, text);
        break;
      default:
        break;
    }
  }

  @On("photo")
  async onPhoto(@Ctx() ctx: TelegrafContext): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const message = ctx.message;
    if (!message || !("photo" in message)) return;

    const session = this.sessionService.getSession(
      telegramId,
      ctx.from?.username || "unknown"
    );

    // Проверка на группу фотографий (media_group_id присутствует когда отправляют несколько фото)
    if ("media_group_id" in message && message.media_group_id) {
      await ctx.reply(MESSAGES.PHOTO_ERROR);
      return;
    }

    const photo = message.photo[message.photo.length - 1];
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    if (session.step === SessionStep.AWAITING_CHILDHOOD_PHOTO) {
      session.childhoodPhotoUrl = fileLink.href;
      this.sessionService.setStep(
        telegramId,
        SessionStep.AWAITING_CURRENT_PHOTO
      );
      await ctx.reply(MESSAGES.ASK_CURRENT_PHOTO);
    } else if (session.step === SessionStep.AWAITING_CURRENT_PHOTO) {
      session.currentPhotoUrl = fileLink.href;
      await this.finishRegistration(ctx, session);
    }
  }

  private async handleName(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    session.fullName = text;
    const telegramId = ctx.from!.id;

    if (session.status === ParticipationStatus.DECLINED) {
      await this.botService.saveRegistration(session);
      this.sessionService.setStep(telegramId, SessionStep.COMPLETED);
      await ctx.reply(MESSAGES.DECLINED);
      return;
    }

    if (session.status === ParticipationStatus.WITH_GUEST) {
      this.sessionService.setStep(
        telegramId,
        SessionStep.AWAITING_GUESTS_COUNT
      );
      await ctx.reply(MESSAGES.ASK_GUESTS_COUNT);
      return;
    }

    if (session.status === ParticipationStatus.WITH_CHILD) {
      this.sessionService.setStep(
        telegramId,
        SessionStep.AWAITING_CHILDREN_COUNT
      );
      await ctx.reply(MESSAGES.ASK_CHILDREN_COUNT);
      return;
    }

    this.sessionService.setStep(
      telegramId,
      SessionStep.AWAITING_CHILDHOOD_PHOTO
    );
    await ctx.reply(MESSAGES.ASK_PHOTOS);
  }

  private async handleGuestsCount(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    const count = parseInt(text, 10);
    const telegramId = ctx.from!.id;

    if (isNaN(count) || count < 1) {
      await ctx.reply("Пожалуйста, введите число больше 0.");
      return;
    }

    session.guestsCount = count;
    session.currentGuestIndex = 0;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_GUEST_NAME);
    await ctx.reply(MESSAGES.ASK_GUEST_NAME(0));
  }

  private async handleGuestName(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    const telegramId = ctx.from!.id;
    session.guestsNames.push(text);
    session.currentGuestIndex++;

    if (session.currentGuestIndex < (session.guestsCount || 0)) {
      await ctx.reply(MESSAGES.ASK_GUEST_NAME(session.currentGuestIndex));
      return;
    }

    this.sessionService.setStep(
      telegramId,
      SessionStep.AWAITING_CHILDHOOD_PHOTO
    );
    await ctx.reply(MESSAGES.ASK_PHOTOS);
  }

  private async handleChildrenCount(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    const count = parseInt(text, 10);
    const telegramId = ctx.from!.id;

    if (isNaN(count) || count < 1) {
      await ctx.reply("Пожалуйста, введите число больше 0.");
      return;
    }

    session.childrenCount = count;
    session.currentChildIndex = 0;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_CHILD_NAME);
    await ctx.reply(MESSAGES.ASK_CHILD_NAME(0));
  }

  private async handleChildName(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    const telegramId = ctx.from!.id;
    session.currentChildName = text;
    this.sessionService.setStep(telegramId, SessionStep.AWAITING_CHILD_AGE);
    await ctx.reply(MESSAGES.ASK_CHILD_AGE(text));
  }

  private async handleChildAge(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    const age = parseInt(text, 10);
    const telegramId = ctx.from!.id;

    if (isNaN(age) || age < 0) {
      await ctx.reply("Пожалуйста, введите корректный возраст.");
      return;
    }

    session.childrenData.push({
      name: session.currentChildName || "",
      age,
      hasPerformance: false,
    });

    this.sessionService.setStep(
      telegramId,
      SessionStep.AWAITING_PERFORMANCE_CHOICE
    );
    await ctx.reply(
      MESSAGES.ASK_PERFORMANCE,
      Markup.inlineKeyboard([
        [Markup.button.callback("Готовит номер", "performance_yes")],
        [Markup.button.callback("Пропустить", "performance_no")],
      ])
    );
  }

  private async handlePerformanceDescription(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>,
    text: string
  ): Promise<void> {
    const telegramId = ctx.from!.id;
    const currentChild = session.childrenData[session.currentChildIndex];

    if (currentChild) {
      currentChild.hasPerformance = true;
      currentChild.performanceDescription = text;
    }

    session.currentChildIndex++;

    if (session.currentChildIndex < (session.childrenCount || 0)) {
      this.sessionService.setStep(telegramId, SessionStep.AWAITING_CHILD_NAME);
      await ctx.reply(MESSAGES.ASK_CHILD_NAME(session.currentChildIndex));
      return;
    }

    this.sessionService.setStep(
      telegramId,
      SessionStep.AWAITING_CHILDHOOD_PHOTO
    );
    await ctx.reply(MESSAGES.ASK_PHOTOS);
  }

  private async finishRegistration(
    ctx: TelegrafContext,
    session: ReturnType<SessionService["getSession"]>
  ): Promise<void> {
    const telegramId = ctx.from!.id;

    await this.botService.saveRegistration(session);
    this.sessionService.setStep(telegramId, SessionStep.COMPLETED);

    const message =
      session.status === ParticipationStatus.GOING
        ? MESSAGES.CONFIRM_SOLO
        : MESSAGES.CONFIRM_GROUP;

    await ctx.reply(message);
  }
}
