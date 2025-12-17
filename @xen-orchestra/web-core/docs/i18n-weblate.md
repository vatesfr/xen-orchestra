# Internationalization (i18n) and Weblate usage

> [!NOTE]
> Only `EN` and `FR` locales are fully supported by the XO team.

Internationalization of the app is done with [Vue-i18n](https://vue-i18n.intlify.dev/).

Sources of truth are `en.json` files, that's why this locale is read-only in Weblate.

## Informations about the workflow

### Adding a new locale

When you add a new locale, there might be a delay before the new file is available in the `/web-core/lib/locales/` folder, as the translations' PR is generally reviewed and merged once by the end of the month, before the technical release.

### Adding new translations

When adding new translations in Weblate, an automatic PR is created to update the translation files in the repository.

Weblate checks regularly for new translations and updates the PR accordingly.

When adding new translations, please make sure to follow the [guidelines](#general-guidelines-when-adding-translations-in-weblate) below to ensure consistency across all locales.

## General guidelines when adding translations in Weblate

### Punctuation

Strings punctuation SHOULD be included in the translation key.

This allows better adapting the punctuation to the rules of the target language.

For example:

- in English, interrogative sentences end with a question mark with no space before it
- in French, interrogative sentences end with a question mark with a space before it
- in Spanish, interrogative sentences start with an inverted question mark and end with a question mark with no spaces

> [!IMPORTANT]
> Since HTML is not accepted in translations, you must use a non-breaking space character (` `) instead of `&nbsp;`

#### Example

##### English

```json
{
  "confirm": "Confirm",
  "confirm?": "Confirm?",
  "warning": "Warning",
  "warning!:": "Warning!"
}
```

##### French

```json
{
  "confirm": "Confirmer",
  "confirm?": "Confirmer ?",
  "warning": "Avertissement",
  "warning!:": "Attention !"
}
```

##### Spanish

```json
{
  "confirm": "Confirmar",
  "confirm?": "¿Confirmar?",
  "warning": "Advertencia",
  "warning!:": "¡Atención!"
}
```

### Pluralization

When a number is involved, the translation MUST use [VueI18n pluralization system](https://vue-i18n.intlify.dev/guide/essentials/pluralization.html).

#### Example

##### English

```json
{
  "n-car": "You have one car | You have {n} cars"
}
```

#### French

```json
{
  "n-car": "Vous avez une voiture | Vous avez {n} voitures"
}
```

### Handling zero in pluralization and custom plural forms

When handling the pluralization of zero, you should provide a separate translation value for the zero cases.

#### Example

```json
{
  "item-count": "You have no items | You have one item | You have {n} items"
}
```

#### French

```json
{
  "item-count": "Vous n'avez aucun article | Vous avez un article | Vous avez {n} articles"
}
```

To use a custom plural form for complex translations, please refer to the [VueI18n custom pluralization documentation](https://vue-i18n.intlify.dev/guide/essentials/pluralization.html#custom-pluralization).

> [!NOTE]
> You can check the pluralization rules for each language on the info page of the locale in Weblate (e.g. https://translate.vates.tech/projects/xen-orchestra/xen-orchestra-6/en/#information).

### Linked translations

Sometimes we may need to add the same translation for different keys, because in one language the translation is the same, but in another language it may differ due to context (for example, in french the gender differs depending on the context).

If the translation in your language for this new key is the same as an already existing one, to avoid duplications you can use linked translations with the syntax `@:<key>`.

#### Example

```json
{
  "save": "Save",
  "save-changes": "@:save"
}
```

This provides the option to override the `save-changes` translation in some locales if needed, while keeping the same translation as `save` by default.
