import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { memberService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import type { Member, MemberInput } from '../types';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

export const MembersPage = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>(() => memberService.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const refreshMembers = useCallback(() => {
    setMembers(memberService.getAll());
  }, []);

  useBodyScrollLock(isModalOpen);

  const handleAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; member: Member | null }>({ isOpen: false, member: null });

  const handleDelete = (member: Member) => {
    if (member.isDefault) {
      toast.error('デフォルトメンバーは削除できません');
      return;
    }
    setDeleteConfirm({ isOpen: true, member });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.member) return;
    memberService.delete(deleteConfirm.member.id);
    refreshMembers();
    toast.success('メンバーを削除しました');
  };

  const handleSave = (input: MemberInput) => {
    if (editingMember) {
      memberService.update(editingMember.id, input);
      toast.success('メンバーを更新しました');
    } else {
      memberService.create(input);
      toast.success('メンバーを追加しました');
    }
    refreshMembers();
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">メンバー管理</h2>
      </div>

      {/* 説明 */}
      <p className="text-sm text-gray-500">
        家族のメンバーを管理します。メンバーごとに口座やカテゴリを分けることができます。
      </p>

      {/* 追加ボタン */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium"
      >
        <Plus size={20} />
        メンバーを追加
      </button>

      {/* メンバー一覧 */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">メンバーがいません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  {member.isDefault && (
                    <p className="text-xs text-gray-400">デフォルト</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(member)} className="p-2 text-gray-400 hover:text-gray-600">
                  <Edit2 size={16} />
                </button>
                {!member.isDefault && (
                  <button onClick={() => handleDelete(member)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {isModalOpen && (
        <MemberModal
          member={editingMember}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, member: null })}
        onConfirm={confirmDelete}
        title="メンバーを削除"
        message="このメンバーを削除してもよろしいですか？"
        confirmText="削除"
        confirmVariant="danger"
      />
    </div>
  );
};

interface MemberModalProps {
  member: Member | null;
  onSave: (input: MemberInput) => void;
  onClose: () => void;
}

const MemberModal = ({ member, onSave, onClose }: MemberModalProps) => {
  const [name, setName] = useState(member?.name || '');
  const [color, setColor] = useState(member?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      color,
      isDefault: member?.isDefault,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{member ? 'メンバーを編集' : 'メンバーを追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 太郎"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
