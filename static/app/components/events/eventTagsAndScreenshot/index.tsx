import styled from '@emotion/styled';

import {DataSection} from 'app/components/events/styles';
import space from 'app/styles/space';

import Screenshot from './screenshot';
import Tags from './tags';

type Props = Omit<React.ComponentProps<typeof Tags>, 'projectSlug'> & {
  projectId: string;
  isShare: boolean;
  hasContext: boolean;
  isBorderless: boolean;
};

function EventTagsAndScreenshots({
  projectId: projectSlug,
  isShare,
  hasContext,
  hasQueryFeature,
  location,
  isBorderless,
  event,
  ...props
}: Props) {
  const {tags = []} = event;

  if (!tags.length && !hasContext && isShare) {
    return null;
  }

  return (
    <Wrapper isBorderless={isBorderless}>
      {!isShare && <Screenshot {...props} event={event} projectSlug={projectSlug} />}
      <Tags
        {...props}
        event={event}
        projectSlug={projectSlug}
        hasContext={hasContext}
        hasQueryFeature={hasQueryFeature}
        location={location}
      />
    </Wrapper>
  );
}

export default EventTagsAndScreenshots;

const Wrapper = styled(DataSection)<{isBorderless: boolean}>`
  display: grid;
  grid-gap: ${space(3)};

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    && {
      padding: 0;
      border: 0;
    }
  }

  @media (min-width: ${p => p.theme.breakpoints[0]}) {
    padding-bottom: ${space(2)};
    grid-template-columns: auto minmax(0, 1fr);
    grid-gap: ${space(4)};

    > *:first-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
  }

  ${p =>
    p.isBorderless &&
    `
    && {
        padding: ${space(3)} 0 0 0;
        :first-child {
          padding-top: 0;
          border-top: 0;
        }
      }
    `}
`;
