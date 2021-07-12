import {Fragment, useEffect, useState} from 'react';
import styled from '@emotion/styled';

import {openModal} from 'app/actionCreators/modal';
import {Client} from 'app/api';
import Role from 'app/components/acl/role';
import MenuItemActionLink from 'app/components/actions/menuItemActionLink';
import Button from 'app/components/button';
import ButtonBar from 'app/components/buttonBar';
import DropdownLink from 'app/components/dropdownLink';
import {Panel, PanelBody, PanelFooter} from 'app/components/panels';
import {IconDownload, IconEllipsis} from 'app/icons';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {EventAttachment, Organization, Project} from 'app/types';
import {Event} from 'app/types/event';
import withApi from 'app/utils/withApi';

import DataSection from '../dataSection';

import ImageVisualization from './imageVisualization';
import Modal, {modalCss} from './modal';

type Props = {
  event: Event;
  api: Client;
  organization: Organization;
  projectSlug: Project['slug'];
};

function Screenshot({event, api, organization, projectSlug}: Props) {
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const orgSlug = organization.slug;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!event) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.requestPromise(
        `/projects/${orgSlug}/${projectSlug}/events/${event.id}/attachments/`
      );
      setAttachments(response);
      setIsLoading(false);
    } catch (_err) {
      // TODO: Error-handling
      setAttachments([]);
      setIsLoading(false);
    }
  }

  function hasScreenshot(attachment: EventAttachment) {
    const {name, mimetype} = attachment;
    // return (
    //   (mimetype === 'image/jpeg' || mimetype === 'image/png') && name === 'screenshot'
    // );
    return mimetype === 'image/jpeg' || mimetype === 'image/png';
  }

  function handleOpenVisualizationModal(eventAttachment: EventAttachment) {
    openModal(
      modalProps => (
        <Modal
          {...modalProps}
          event={event}
          orgSlug={orgSlug}
          projectSlug={projectSlug}
          eventAttachment={eventAttachment}
        />
      ),
      {modalCss}
    );
  }

  function renderContent(screenshotAttachment: EventAttachment) {
    const downloadUrl = `/api/0/projects/${organization.slug}/${projectSlug}/events/${event.id}/attachments/${screenshotAttachment.id}/`;

    return (
      <Fragment>
        <StyledPanelBody>
          <ImageVisualization
            attachment={screenshotAttachment}
            orgId={orgSlug}
            projectId={projectSlug}
            event={event}
          />
        </StyledPanelBody>
        <StyledPanelFooter>
          <StyledButtonbar gap={1}>
            <Button
              size="xsmall"
              onClick={() => handleOpenVisualizationModal(screenshotAttachment)}
            >
              {t('View screenshot')}
            </Button>
            <DropdownLink
              caret={false}
              customTitle={
                <Button
                  label={t('Actions')}
                  size="xsmall"
                  icon={<IconEllipsis size="xs" />}
                />
              }
              anchorRight
            >
              <MenuItemActionLink
                shouldConfirm={false}
                icon={<IconDownload size="xs" />}
                title={t('Download')}
                href={`${downloadUrl}?download=1`}
              >
                {t('Download')}
              </MenuItemActionLink>
            </DropdownLink>
          </StyledButtonbar>
        </StyledPanelFooter>
      </Fragment>
    );
  }

  return (
    <Role role={organization.attachmentsRole}>
      {({hasRole}) => {
        const screenshotAttachment = attachments.find(hasScreenshot);

        if (!hasRole || isLoading || !screenshotAttachment) {
          return null;
        }

        return (
          <DataSection
            title={t('Screenshots')}
            description={t(
              'Screenshots help identify what the user saw when the exception happened'
            )}
          >
            <StyledPanel>{renderContent(screenshotAttachment)}</StyledPanel>
          </DataSection>
        );
      }}
    </Role>
  );
}

export default withApi(Screenshot);

const StyledPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
  min-width: 175px;
  min-height: 200px;
  overflow: hidden;
`;

const StyledPanelBody = styled(PanelBody)`
  height: 175px;
  width: 100%;
  overflow: hidden;
`;

const StyledPanelFooter = styled(PanelFooter)`
  padding: ${space(1)};
  width: 100%;
`;

const StyledButtonbar = styled(ButtonBar)`
  justify-content: space-between;
  .dropdown {
    height: 24px;
  }
`;
