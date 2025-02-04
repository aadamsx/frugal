import { createGlobalStyle, styled } from '../dep/frugal/styled.ts';
import { link } from '../styles/link.style.ts';
import * as gmf from '../dep/gmf.ts';

createGlobalStyle`
    ${gmf.CSS}
`;

export const markdown = styled('markdown')`
    padding: 2rem 0;

    a:not(.anchor) { 
        ${link.css} 
    }

    h1, h2 {
        border: none;
    }
`;
