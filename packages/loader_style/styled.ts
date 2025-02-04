import * as murmur from '../murmur/mod.ts';

const SCOPED_CLASSNAMES = new Set<string>();
const RULES: Rules[] = [];
const GLOBAL_STYLES: string[] = [];
const KEYFRAME_NAMES = new Set<string>();
const KEYFRAMES: KeyFrames[] = [];

export class Rules {
    selector: string;
    ownCss: string;
    css: string;
    className: string;

    constructor(className: string, properties: string, selector: string) {
        this.ownCss = properties;
        this.selector = selector;
        this.className = className;
        this.css = properties;
    }

    toCss() {
        return `${this.selector} {${this.ownCss}}`;
    }
}

export class ScopedRules extends Rules {
    constructor(hint: string, properties: string, parents: ScopedRules[]) {
        const hash = new murmur.Hash().update(hint).update(properties);
        parents.forEach((rule) => {
            hash.update(rule.className);
        });

        const className = `${hint || 'c'}-${hash.alphabetic()}`;

        super(className, properties, `.${className}`);

        this.className = cx(
            className,
            ...parents.map((parent) => parent.className),
        );

        this.css = `${
            parents.map((parent) => parent.css).join('\n')
        }\n${this.ownCss}`;
    }
}

class KeyFrames {
    name: string;
    css: string;

    constructor(properties: string) {
        const hash = new murmur.Hash().update(properties);

        this.name = `a-${hash.alphabetic()}`;
        this.css = properties;
    }

    toCss() {
        return `@keyframes ${this.name} {${this.css}}`;
    }
}

type Interpolable = (string | number | Rules | KeyFrames);

function css(
    template: TemplateStringsArray,
    ...interpolations: Interpolable[]
): string {
    const propertyList: string[] = [template[0]];

    interpolations.forEach((interpolation, i) => {
        propertyList.push(
            interpolation instanceof Rules
                ? interpolation.selector
                : interpolation instanceof KeyFrames
                ? interpolation.name
                : String(interpolation),
        );
        propertyList.push(template[i + 1]);
    });

    return propertyList.join('');
}

export function inherit(...parents: ScopedRules[]) {
    return {
        styled: (hint: string) => styled(hint, ...parents),
    };
}

export function styled(hint: string, ...parents: ScopedRules[]) {
    const extended: ScopedRules[] = [...parents];

    return scoped;

    function scoped(
        template: TemplateStringsArray,
        ...interpolations: Interpolable[]
    ) {
        const properties = css(template, ...interpolations);
        const rule = new ScopedRules(hint, properties, extended);
        if (!SCOPED_CLASSNAMES.has(rule.className)) {
            RULES.push(rule);
            SCOPED_CLASSNAMES.add(rule.className);
        }
        return rule;
    }
}

export const global = {
    styled: globalStyle,
};

function globalStyle(className: string) {
    return global;

    function global(
        template: TemplateStringsArray,
        ...interpolations: Interpolable[]
    ) {
        const properties = css(template, ...interpolations);
        const rule = new Rules(className, properties, `.${className}`);
        RULES.push(rule);

        return rule;
    }
}

export function createGlobalStyle(
    template: TemplateStringsArray,
    ...interpolations: Interpolable[]
) {
    const properties = css(template, ...interpolations);
    GLOBAL_STYLES.push(properties);
}

export function keyframes(
    template: TemplateStringsArray,
    ...interpolations: Interpolable[]
): KeyFrames {
    const properties = css(template, ...interpolations);
    const keyframes = new KeyFrames(properties);
    if (!KEYFRAME_NAMES.has(keyframes.name)) {
        KEYFRAMES.push(keyframes);
        KEYFRAME_NAMES.add(keyframes.name);
    }
    return keyframes;
}

export function cx(
    ...classNames: (string | boolean | undefined | null | Rules)[]
): string {
    return classNames
        .filter((name) => name instanceof Rules || typeof name === 'string')
        .map((name) => {
            if (name instanceof Rules) return name.className;
            return name;
        }).join(' ');
}

export function output(): string {
    const keyframes = KEYFRAMES.map((keyframes) => keyframes.toCss()).join(
        '\n',
    );
    const globalStyles = GLOBAL_STYLES.join('\n');
    const rules = RULES.map((rule) => rule.toCss()).join('\n');
    return `${keyframes}\n${globalStyles}\n${rules}`;
}
