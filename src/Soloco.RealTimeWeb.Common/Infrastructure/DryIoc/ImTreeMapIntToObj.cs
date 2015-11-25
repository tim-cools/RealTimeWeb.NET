using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Simple immutable AVL tree with integer keys and object values.</summary>
    public sealed class ImTreeMapIntToObj
    {
        /// <summary>Empty tree to start with.</summary>
        public static readonly ImTreeMapIntToObj Empty = new ImTreeMapIntToObj();

        /// <summary>Key.</summary>
        public readonly int Key;

        /// <summary>Value.</summary>
        public readonly object Value;

        /// <summary>Left sub-tree/branch, or empty.</summary>
        public readonly ImTreeMapIntToObj Left;

        /// <summary>Right sub-tree/branch, or empty.</summary>
        public readonly ImTreeMapIntToObj Right;

        /// <summary>Height of longest sub-tree/branch plus 1. It is 0 for empty tree, and 1 for single node tree.</summary>
        public readonly int Height;

        /// <summary>Returns true is tree is empty.</summary>
        public bool IsEmpty { get { return Height == 0; } }

        /// <summary>Returns new tree with added or updated value for specified key.</summary>
        /// <param name="key"></param> <param name="value"></param>
        /// <returns>New tree.</returns>
        public ImTreeMapIntToObj AddOrUpdate(int key, object value)
        {
            return AddOrUpdate(key, value, false, null);
        }

        /// <summary>Delegate to calculate new value from and old and a new value.</summary>
        /// <param name="oldValue">Old</param> <param name="newValue">New</param> <returns>Calculated result.</returns>
        public delegate object UpdateValue(object oldValue, object newValue);

        /// <summary>Returns new tree with added or updated value for specified key.</summary>
        /// <param name="key">Key</param> <param name="value">Value</param>
        /// <param name="updateValue">(optional) Delegate to calculate new value from and old and a new value.</param>
        /// <returns>New tree.</returns>
        public ImTreeMapIntToObj AddOrUpdate(int key, object value, UpdateValue updateValue)
        {
            return AddOrUpdate(key, value, false, updateValue);
        }

        /// <summary>Returns new tree with updated value for the key, Or the same tree if key was not found.</summary>
        /// <param name="key"></param> <param name="value"></param>
        /// <returns>New tree if key is found, or the same tree otherwise.</returns>
        public ImTreeMapIntToObj Update(int key, object value)
        {
            return AddOrUpdate(key, value, true, null);
        }

        /// <summary>Get value for found key or null otherwise.</summary>
        /// <param name="key"></param> <returns>Found value or null.</returns>
        public object GetValueOrDefault(int key)
        {
            var tree = this;
            while (tree.Height != 0 && tree.Key != key)
                tree = key < tree.Key ? tree.Left : tree.Right;
            return tree.Height != 0 ? tree.Value : null;
        }

        /// <summary>Returns all sub-trees enumerated from left to right.</summary> 
        /// <returns>Enumerated sub-trees or empty if tree is empty.</returns>
        public IEnumerable<ImTreeMapIntToObj> Enumerate()
        {
            if (Height == 0)
                yield break;

            var parents = new ImTreeMapIntToObj[Height];

            var tree = this;
            var parentCount = -1;
            while (tree.Height != 0 || parentCount != -1)
            {
                if (tree.Height != 0)
                {
                    parents[++parentCount] = tree;
                    tree = tree.Left;
                }
                else
                {
                    tree = parents[parentCount--];
                    yield return tree;
                    tree = tree.Right;
                }
            }
        }

        #region Implementation

        private ImTreeMapIntToObj() { }

        private ImTreeMapIntToObj(int key, object value, ImTreeMapIntToObj left, ImTreeMapIntToObj right)
        {
            Key = key;
            Value = value;
            Left = left;
            Right = right;
            Height = 1 + (left.Height > right.Height ? left.Height : right.Height);
        }

        private ImTreeMapIntToObj AddOrUpdate(int key, object value, bool updateOnly, UpdateValue update)
        {
            return Height == 0 ? // tree is empty
                (updateOnly ? this : new ImTreeMapIntToObj(key, value, Empty, Empty))
                : (key == Key ? // actual update
                    new ImTreeMapIntToObj(key, update == null ? value : update(Value, value), Left, Right)
                    : (key < Key    // try update on left or right sub-tree
                        ? With(Left.AddOrUpdate(key, value, updateOnly, update), Right)
                        : With(Left, Right.AddOrUpdate(key, value, updateOnly, update))).KeepBalanced());
        }

        private ImTreeMapIntToObj KeepBalanced()
        {
            var delta = Left.Height - Right.Height;
            return delta >= 2 ? With(Left.Right.Height - Left.Left.Height == 1 ? Left.RotateLeft() : Left, Right).RotateRight()
                : (delta <= -2 ? With(Left, Right.Left.Height - Right.Right.Height == 1 ? Right.RotateRight() : Right).RotateLeft()
                    : this);
        }

        private ImTreeMapIntToObj RotateRight()
        {
            return Left.With(Left.Left, With(Left.Right, Right));
        }

        private ImTreeMapIntToObj RotateLeft()
        {
            return Right.With(With(Left, Right.Left), Right.Right);
        }

        private ImTreeMapIntToObj With(ImTreeMapIntToObj left, ImTreeMapIntToObj right)
        {
            return left == Left && right == Right ? this : new ImTreeMapIntToObj(Key, Value, left, right);
        }

        #endregion
    }
}