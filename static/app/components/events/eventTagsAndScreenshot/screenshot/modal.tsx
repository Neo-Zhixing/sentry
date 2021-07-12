import {Fragment} from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import {ModalRenderProps} from 'app/actionCreators/modal';
import NotAvailable from 'app/components/notAvailable';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {EventAttachment, Organization, Project} from 'app/types';
import {Event} from 'app/types/event';

import ImageVisualization from './imageVisualization';

type Props = ModalRenderProps & {
  eventAttachment: EventAttachment;
  orgSlug: Organization['slug'];
  projectSlug: Project['slug'];
  event: Event;
};

function Modal({eventAttachment, orgSlug, projectSlug, Header, Body, event}: Props) {
  const {dateCreated, name, size, mimetype, type} = eventAttachment;
  return (
    <Fragment>
      <Header closeButton>{t('Event Screenshot')}</Header>
      <Body>
        <GeralInfo>
          <Label coloredBg>{t('Date Created')}</Label>
          <Value coloredBg>{dateCreated ?? <NotAvailable />}</Value>

          <Label>{t('Name')}</Label>
          <Value>{name ?? <NotAvailable />}</Value>

          <Label coloredBg>{t('Size')}</Label>
          <Value coloredBg>{size ?? <NotAvailable />}</Value>

          <Label>{t('Mimetype')}</Label>
          <Value>{mimetype ?? <NotAvailable />}</Value>

          <Label coloredBg>{t('Type')}</Label>
          <Value coloredBg>{type ?? <NotAvailable />}</Value>
        </GeralInfo>

        <ImageVisualization
          attachment={eventAttachment}
          orgId={orgSlug}
          projectId={projectSlug}
          event={event}
        />
      </Body>
    </Fragment>
  );
}

export default Modal;

const GeralInfo = styled('div')`
  display: grid;
  grid-template-columns: max-content 1fr;
`;

const Label = styled('div')<{coloredBg?: boolean}>`
  color: ${p => p.theme.textColor};
  padding: ${space(1)} ${space(1.5)} ${space(1)} ${space(1)};
  ${p => p.coloredBg && `background-color: ${p.theme.backgroundSecondary};`}
`;

const Value = styled(Label)`
  white-space: pre-wrap;
  word-break: break-all;
  color: ${p => p.theme.subText};
  padding: ${space(1)};
  font-family: ${p => p.theme.text.familyMono};
  ${p => p.coloredBg && `background-color: ${p.theme.backgroundSecondary};`}
`;

export const modalCss = css``;
