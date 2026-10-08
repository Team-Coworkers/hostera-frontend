import { Injectable } from '@angular/core';
import {
  InterpolateFunction,
  InterpolationParameters,
  TranslateParser,
} from '@ngx-translate/core';

/**
 * Interpolates messages written in the Vue I18n syntax, so the locale files of the Vue
 * version are reused without changes:
 *
 * - Named arguments: `{name}` takes `params.name`.
 * - Literals: `{'@'}` renders `@`.
 * - Plurals: `none | one | many` (or `one | many`) picks a form by `params.count`,
 *   following Vue I18n's default choice rule.
 */
@Injectable()
export class VueI18nMessageParser extends TranslateParser {
  /**
   * @param expr - Message, or a compiled message function.
   * @param params - Named arguments; `count` selects the plural form.
   * @returns Interpolated message.
   */
  interpolate(
    expr: InterpolateFunction | string,
    params?: InterpolationParameters,
  ): string | undefined {
    if (typeof expr === 'function') return expr(params);
    if (typeof expr !== 'string') return expr;
    const count = params?.['count'];
    const message = typeof count === 'number' ? this.choose(expr, count) : expr;
    return message.replace(
      /\{\s*(?:'([^']*)'|([\w.-]+))\s*\}/g,
      (match, literal: string | undefined, name: string | undefined) => {
        if (literal !== undefined) return literal;
        const value = name !== undefined ? params?.[name] : undefined;
        return value === undefined || value === null ? match : String(value);
      },
    );
  }

  /**
   * Picks the plural form of a message, as Vue I18n does without a custom rule.
   * @param message - Message with forms separated by `|`.
   * @param count - Number that selects the form.
   * @returns Selected form, or the message when it has a single form.
   */
  private choose(message: string, count: number): string {
    const forms = message.split('|').map((form) => form.trim());
    if (forms.length < 2) return message;
    const choice = Math.abs(count);
    const index =
      forms.length === 2
        ? choice === 1
          ? 0
          : 1
        : choice
          ? Math.min(choice, 2)
          : 0;
    return forms[index] ?? message;
  }
}
