import {Location} from 'history';

import {t} from 'app/locale';
import {Organization, Project} from 'app/types';
import {Event} from 'app/types/event';

import EventTags from '../eventTags/eventTags';

import DataSection from './dataSection';
import TagsHighlight from './tagsHighlight';

type Props = {
  event: Event;
  organization: Organization;
  projectSlug: Project['slug'];
  location: Location;
  hasQueryFeature: boolean;
  hasContext: boolean;
};

function Tags({
  event,
  organization,
  projectSlug,
  location,
  hasContext,
  hasQueryFeature,
}: Props) {
  return (
    <DataSection
      title={t('Tags')}
      description={t(
        'Tags help you quickly both access related events and view the tag distribution for a set of events'
      )}
    >
      {hasContext && <TagsHighlight event={event} />}
      <EventTags
        event={event}
        organization={organization}
        projectId={projectSlug}
        location={location}
        hasQueryFeature={hasQueryFeature}
      />
    </DataSection>
  );
}

export default Tags;
