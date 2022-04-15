/** @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { HeroHeader } from '../../components/HeroHeader.tsx';
import { Navigation } from '../../components/Navigation.tsx';
import { useData } from '../../dep/frugal/frugal_preact.server.ts';

import { Form } from './Form.server.tsx';

import * as s from './Page.style.ts';
import { link } from '../../styles/link.style.ts';
import { Data } from './type.ts';

export function Page() {
    const data = useData<Data>();
    return (
        <>
            <Navigation />

            <HeroHeader />

            <main class={cx(s.mainContainer)}>
                <p>
                    Frugal is a web framework with resource sparing in mind.
                    Send the right amount of js, keep what's meant to be static
                    static, offload to the server when needed.
                </p>
                <ul>
                    <li>
                        <em class={cx(s.emphasis)}>
                            Static pages rendered at build time
                        </em>: by default frugal produces static html.
                    </li>
                    <li>
                        <em class={cx(s.emphasis)}>Server side pages render</em>
                        {' '}
                        at request time
                    </li>
                    <li>
                        <em class={cx(s.emphasis)}>
                            Bring your own framework
                        </em>: frugal works with any UI framework able to
                        compile to html
                    </li>
                    <li>
                        <em class={cx(s.emphasis)}>
                            Manual partial hydration
                        </em>{' '}
                        for interactive island in pages of you use{' '}
                        <a class={cx(link)} href='#'>Preact</a>
                    </li>
                    <li>
                        <em class={cx(s.emphasis)}>
                            Form submission client-side or server-side
                        </em>{' '}
                        for both static and dynamic pages
                    </li>
                    <li>
                        <em class={cx(s.emphasis)}>Incremental build</em>: if
                        both data and code did not change, the page is not
                        rebuilt
                    </li>
                </ul>
                <p>
                    Learn more about{' '}
                    <a class={cx(link)} href='#'>
                        the philosophy frugal embraces
                    </a>
                </p>

                <Form initialForm={data.form} />
            </main>
        </>
    );
}
