# tiny-svelte
> mini svelte implement

## Svelte Syntax
```js
<fragments> <fragment>| <fragments> <fragment>

<fragment> <script> Kelement> | Sexpression> <text> <script> "<script>" ＜javascript> "</ script>"

<element> <tag-name> <attribute-list>">" <fragments>

stag-name>
```

- [x] parse
    - [x] parseFragments
    - [x] parseScript
    - [x] parseElement
    - [x] parseAttributeList
    - [x] parseAttribute
    - [x] parseExpression
    - [x] parseText
    - [x] parseJavaScript
    - [x] match
    - [x] eat
- [x] analyse
- [x] generate
