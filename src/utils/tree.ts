export function walkTree<TBranch, TLeaf>({
  tree,
  isBranch,
  getChildren,
  walkBranch,
  walkLeaf,
}: {
  tree: (TBranch | TLeaf)[];
  isBranch: (node: TBranch | TLeaf) => node is TBranch;
  getChildren: (branch: TBranch) => (TBranch | TLeaf)[];
  walkBranch?: (branch: TBranch) => void;
  walkLeaf?: (leaf: TLeaf) => void;
}): (TBranch | TLeaf)[] {
  tree.forEach(node => {
    if (isBranch(node)) {
      walkBranch?.(node);
      walkTree({
        tree: getChildren(node),
        isBranch,
        getChildren,
        walkBranch,
        walkLeaf,
      });
    } else {
      walkLeaf?.(node);
    }
  });

  return tree;
}

export function flatTree<TBranch, TLeaf>({
  tree,
  isBranch,
  getChildren,
}: {
  tree: (TBranch | TLeaf)[];
  isBranch: (node: TBranch | TLeaf) => node is TBranch;
  getChildren: (branch: TBranch) => (TBranch | TLeaf)[];
}): TLeaf[] {
  return tree.flatMap(node =>
    isBranch(node)
      ? flatTree({ tree: getChildren(node), isBranch, getChildren })
      : node,
  );
}
