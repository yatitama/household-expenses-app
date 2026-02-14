import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { memberService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
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
 <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">       {/* ヘッダー */}
 <div className="flex items-center gap-2 sm:gap-3">  <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-600 text-xs sm:text-base">  <ArrowLeft size={18} className="sm:w-5 sm:h-5" />         </button>
 <h2 className="text-lg sm:text-xl font-bold text-gray-800">メンバー管理</h2>       </div>

      {/* 説明 */}
 <p className="text-xs sm:text-sm text-gray-500">         家族のメンバーを管理します。メンバーごとに口座やカテゴリを分けることができます。
      </p>

      {/* 追加ボタン */}
      <button
        onClick={handleAdd}
 className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base"       >
 <Plus size={16} className="sm:w-5 sm:h-5" />         メンバーを追加
      </button>

      {/* メンバー一覧 */}
      {members.length === 0 ? (
 <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 text-center">  <Users size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2 sm:mb-3" />  <p className="text-xs sm:text-sm text-gray-500">メンバーがいません</p>         </div>
      ) : (
 <div className="bg-white rounded-lg sm:rounded-xl divide-y divide-gray-100">           {members.map((member) => (
 <div key={member.id} className="flex items-center justify-between p-3 sm:p-4">  <div className="flex items-center gap-2 sm:gap-3">                 <div
 className="w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-base"                   style={{ backgroundColor: member.color }}
                >
                  {member.icon ? getCategoryIcon(member.icon, 14) : member.name.charAt(0)}
                </div>
                <div>
 <p className="text-xs sm:text-sm font-medium text-gray-900">{member.name}</p>                   {member.isDefault && (
 <p className="text-xs text-gray-400">デフォルト</p>                   )}
                </div>
              </div>
 <div className="flex items-center gap-1.5 sm:gap-2">  <button onClick={() => handleEdit(member)} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600">  <Edit2 size={14} className="sm:w-4 sm:h-4" />                 </button>
                {!member.isDefault && (
 <button onClick={() => handleDelete(member)} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-900">  <Trash2 size={14} className="sm:w-4 sm:h-4" />                   </button>
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
  const [icon, setIcon] = useState(member?.icon || 'Users');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      color,
      icon,
      isDefault: member?.isDefault,
    });
  };

  return (
 <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">  <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-3 sm:p-4 max-h-[90vh] overflow-y-auto">  <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{member ? 'メンバーを編集' : 'メンバーを追加'}</h3>  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">           {/* 名前 */}
          <div>
 <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名前</label>             <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 太郎"
 className="w-full rounded-lg px-3 py-2 text-sm bg-white dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"               required
            />
          </div>

          {/* アイコン */}
          <div>
 <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">アイコン</label>  <div className="grid grid-cols-8 gap-2">               {ICON_NAMES.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
 className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center transition-all ${                     icon === iconName
                      ? 'bg-gray-200 text-gray-800 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:text-gray-400'
                  }`}
                >
                  {getCategoryIcon(iconName, 16)}
                </button>
              ))}
            </div>
          </div>

          {/* 色 */}
          <div>
 <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">色</label>  <div className="flex gap-2 flex-wrap">               {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
 className={`w-8 h-8 rounded-full transition-transform ${                     color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* ボタン */}
 <div className="flex gap-3 pt-2">             <button
              type="button"
              onClick={onClose}
 className="flex-1 py-2 px-3 sm:px-4 rounded-lg text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50"             >
              キャンセル
            </button>
            <button
              type="submit"
 className="flex-1 py-2 px-3 sm:px-4 rounded-lg bg-gray-800 text-white font-medium text-sm hover:bg-gray-800"             >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
