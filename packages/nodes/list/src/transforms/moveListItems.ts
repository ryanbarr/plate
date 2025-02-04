import {
  EditorNodesOptions,
  getNodes,
  getParent,
  getPluginType,
  PlateEditor,
} from '@udecode/plate-core';
import { Editor, Path, PathRef } from 'slate';
import { ELEMENT_LIC } from '../createListPlugin';
import { isListNested } from '../queries/isListNested';
import { moveListItemDown } from './moveListItemDown';
import { moveListItemUp } from './moveListItemUp';

export type MoveListItemsOptions = {
  increase?: boolean;
  at?: EditorNodesOptions['at'];
};

export const moveListItems = (
  editor: PlateEditor,
  {
    increase = true,
    at = editor.selection ?? undefined,
  }: MoveListItemsOptions = {}
) => {
  const _nodes = getNodes(editor, {
    at,
    match: {
      type: getPluginType(editor, ELEMENT_LIC),
    },
  });

  // Get the selected lic
  const lics = Array.from(_nodes);

  if (!lics.length) return;

  const highestLicPaths: Path[] = [];
  const highestLicPathRefs: PathRef[] = [];

  // Filter out the nested lic, we just need to move the highest ones
  lics.forEach((lic) => {
    const licPath = lic[1];
    const liPath = Path.parent(licPath);

    const isAncestor = highestLicPaths.some((path) => {
      const highestLiPath = Path.parent(path);

      return Path.isAncestor(highestLiPath, liPath);
    });
    if (!isAncestor) {
      highestLicPaths.push(licPath);
      highestLicPathRefs.push(Editor.pathRef(editor, licPath));
    }
  });

  const licPathRefsToMove = increase
    ? highestLicPathRefs
    : highestLicPathRefs.reverse();

  Editor.withoutNormalizing(editor, () => {
    licPathRefsToMove.forEach((licPathRef) => {
      const licPath = licPathRef.unref();
      if (!licPath) return;

      const listItem = getParent(editor, licPath);
      if (!listItem) return;
      const listEntry = getParent(editor, listItem[1]);

      if (increase) {
        moveListItemDown(editor, {
          list: listEntry as any,
          listItem: listItem as any,
        });
      } else if (listEntry && isListNested(editor, listEntry[1])) {
        moveListItemUp(editor, {
          list: listEntry as any,
          listItem: listItem as any,
        });
      }
    });
  });
};
