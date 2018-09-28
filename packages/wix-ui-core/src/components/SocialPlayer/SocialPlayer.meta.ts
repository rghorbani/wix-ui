import {SocialPlayer} from './SocialPlayer';
import Registry from '@ui-autotools/registry';

const socialVideoMetadata = Registry.getComponentMetadata(SocialPlayer);
socialVideoMetadata
  .addSim({
    title: 'Simulation with default props',
    props: {}
  });
