import type { Location } from 'react-router-dom';
import type { ManuScreenContext } from '../services/assistantService';

const clean = (value?: string | null, max = 160) => value?.replace(/\s+/g, ' ').trim().slice(0, max) || undefined;

const uniqueText = (elements: Element[], maxItems: number) =>
  Array.from(
    new Set(
      elements
        .filter((element) => {
          const htmlElement = element as HTMLElement;
          return htmlElement.offsetParent !== null;
        })
        .map((element) => clean(element.textContent))
        .filter(Boolean) as string[]
    )
  ).slice(0, maxItems);

const inferRouteParams = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const result: Record<string, string> = {};
  const employeesIndex = segments.indexOf('employees');
  if (employeesIndex >= 0 && segments[employeesIndex + 1]) {
    result.employeeId = segments[employeesIndex + 1].slice(0, 160);
  }
  return result;
};

export const collectManuScreenContext = (
  location: Location,
  pageTitle: string
): ManuScreenContext => {
  const query = Object.fromEntries(
    Array.from(new URLSearchParams(location.search).entries())
      .filter(([key]) => !/(token|password|secret|key)/i.test(key))
      .slice(0, 12)
      .map(([key, value]) => [key.slice(0, 80), value.slice(0, 160)])
  );
  const contextElement = document.querySelector<HTMLElement>('[data-manu-entity]');
  const selectedEntity = contextElement
    ? {
        type: contextElement.dataset.manuEntity || 'record',
        id: contextElement.dataset.manuEntityId,
        label: clean(contextElement.dataset.manuEntityLabel || contextElement.textContent),
      }
    : undefined;
  const activeTab = document.querySelector<HTMLElement>(
    '[role="tab"][aria-selected="true"], [data-manu-active-tab="true"]'
  );

  return {
    pathname: location.pathname,
    pageTitle,
    routeParams: inferRouteParams(location.pathname),
    query,
    activeTab: clean(activeTab?.textContent || activeTab?.dataset.manuTab),
    selectedEntity,
    visibleSections: uniqueText(
      Array.from(document.querySelectorAll('main h1, main h2, main h3, [data-manu-section]')),
      12
    ),
    visibleColumns: uniqueText(Array.from(document.querySelectorAll('main table th')), 16),
  };
};
