import { useDialogState } from 'ariakit';
import { IStream } from 'types';
import { Cancel } from '../Cancel';
import { Modify } from '../Modify';
import { Push } from '../Push';

const StreamActions = ({ data }: { data: IStream }) => {
  const dialog = useDialogState();

  return (
    <span className="relative right-[-8px] flex justify-end space-x-4">
      <Push buttonName="Send" data={data} />
      <button className="rounded bg-zinc-100 py-1 px-2 underline dark:bg-zinc-800" onClick={dialog.toggle}>
        Modify
      </button>
      <Cancel data={data} />
      <Modify data={data} title="Modify" dialog={dialog} />
    </span>
  );
};

export default StreamActions;
