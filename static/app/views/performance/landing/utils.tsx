import {Location} from 'history';

import {t} from 'app/locale';
import {LightWeightOrganization, Organization, Project} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import {AggregationKey, Column} from 'app/utils/discover/fields';
import {
  formatAbbreviatedNumber,
  formatFloat,
  formatPercentage,
  getDuration,
} from 'app/utils/formatters';
import {HistogramData} from 'app/utils/performance/histogram/types';
import {decodeScalar} from 'app/utils/queryString';

import {AxisOption, getTermHelp, PERFORMANCE_TERM} from '../data';
import {Rectangle} from '../transactionSummary/transactionVitals/types';
import {platformToPerformanceType, PROJECT_PERFORMANCE_TYPE} from '../utils';

export const LEFT_AXIS_QUERY_KEY = 'left';
export const RIGHT_AXIS_QUERY_KEY = 'right';

type LandingDisplay = {
  label: string;
  field: LandingDisplayField;
};

export enum LandingDisplayField {
  ALL = 'all',
  FRONTEND_PAGELOAD = 'frontend_pageload',
  FRONTEND_OTHER = 'frontend_other',
  BACKEND = 'backend',
  MOBILE = 'mobile',
}

export const LANDING_DISPLAYS = [
  {
    label: 'All Transactions',
    field: LandingDisplayField.ALL,
  },
  {
    label: 'Frontend (Pageload)',
    field: LandingDisplayField.FRONTEND_PAGELOAD,
  },
  {
    label: 'Frontend (Other)',
    field: LandingDisplayField.FRONTEND_OTHER,
  },
  {
    label: 'Backend',
    field: LandingDisplayField.BACKEND,
  },
  {
    label: 'Mobile',
    field: LandingDisplayField.MOBILE,
    isShown: (organization: Organization) =>
      organization.features.includes('performance-mobile-vitals'),
    alpha: true,
  },
];

export function getCurrentLandingDisplay(
  location: Location,
  projects: Project[],
  eventView?: EventView
): LandingDisplay {
  const landingField = decodeScalar(location?.query?.landingDisplay);
  const display = LANDING_DISPLAYS.find(({field}) => field === landingField);
  if (display) {
    return display;
  }

  const defaultDisplayField = getDefaultDisplayFieldForPlatform(projects, eventView);
  const defaultDisplay = LANDING_DISPLAYS.find(
    ({field}) => field === defaultDisplayField
  );
  return defaultDisplay || LANDING_DISPLAYS[0];
}

export function getChartWidth(chartData: HistogramData, refPixelRect: Rectangle | null) {
  const distance = refPixelRect ? refPixelRect.point2.x - refPixelRect.point1.x : 0;
  const chartWidth = chartData.length * distance;

  return {
    chartWidth,
  };
}

export function getBackendFunction(
  functionName: AggregationKey,
  organization: Organization
): Column {
  switch (functionName) {
    case 'p75':
      return {
        kind: 'function',
        function: ['p75', 'transaction.duration', undefined, undefined],
      };
    case 'tpm':
      return {kind: 'function', function: ['tpm', '', undefined, undefined]};
    case 'failure_rate':
      return {kind: 'function', function: ['failure_rate', '', undefined, undefined]};
    case 'apdex':
      if (organization.features.includes('project-transaction-threshold')) {
        return {
          kind: 'function',
          function: ['apdex' as AggregationKey, '', undefined, undefined],
        };
      }
      return {
        kind: 'function',
        function: ['apdex', `${organization.apdexThreshold}`, undefined, undefined],
      };
    default:
      throw new Error(`Unsupported backend function: ${functionName}`);
  }
}

export function getDefaultDisplayFieldForPlatform(
  projects: Project[],
  eventView?: EventView
) {
  if (!eventView) {
    return LandingDisplayField.ALL;
  }
  const projectIds = eventView.project;

  const performanceTypeToDisplay = {
    [PROJECT_PERFORMANCE_TYPE.ANY]: LandingDisplayField.ALL,
    [PROJECT_PERFORMANCE_TYPE.FRONTEND]: LandingDisplayField.FRONTEND_PAGELOAD,
    [PROJECT_PERFORMANCE_TYPE.BACKEND]: LandingDisplayField.BACKEND,
  };
  const performanceType = platformToPerformanceType(projects, projectIds);
  const landingField =
    performanceTypeToDisplay[performanceType] ?? LandingDisplayField.ALL;
  return landingField;
}

export const backendCardDetails = (organization: LightWeightOrganization) => {
  return {
    p75: {
      title: t('Duration (p75)'),
      tooltip: getTermHelp(organization, PERFORMANCE_TERM.P75),
      formatter: value => getDuration(value / 1000, value >= 1000 ? 3 : 0, true),
    },
    tpm: {
      title: t('Throughput'),
      tooltip: getTermHelp(organization, PERFORMANCE_TERM.THROUGHPUT),
      formatter: formatAbbreviatedNumber,
    },
    failure_rate: {
      title: t('Failure Rate'),
      tooltip: getTermHelp(organization, PERFORMANCE_TERM.FAILURE_RATE),
      formatter: value => formatPercentage(value, 2),
    },
    apdex: {
      title: t('Apdex'),
      tooltip: organization.features.includes('project-transaction-threshold')
        ? getTermHelp(organization, PERFORMANCE_TERM.APDEX_NEW)
        : getTermHelp(organization, PERFORMANCE_TERM.APDEX),
      formatter: value => formatFloat(value, 4),
    },
  };
};

export function getDisplayAxes(options: AxisOption[], location: Location) {
  const leftDefault = options.find(opt => opt.isLeftDefault) || options[0];
  const rightDefault = options.find(opt => opt.isRightDefault) || options[1];

  const leftAxis =
    options.find(opt => opt.value === location.query[LEFT_AXIS_QUERY_KEY]) || leftDefault;
  const rightAxis =
    options.find(opt => opt.value === location.query[RIGHT_AXIS_QUERY_KEY]) ||
    rightDefault;
  return {
    leftAxis,
    rightAxis,
  };
}
