import { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer, Modal, Form, Input, Button, Dropdown, theme } from 'antd';
import type { InputRef, MenuProps } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getRandomId } from '~/entrypoints/common/utils';
import type { SearchEngine } from '~/entrypoints/types';
import Favicon from '~/entrypoints/common/components/Favicon';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import {
  StyledEngineList,
  StyledEngineItem,
  StyledEngineItemInfo,
} from './SearchEngine.styled';

interface SearchEngineModalProps {
  visible: boolean;
  data: SearchEngine[];
  onOk?: (engines: SearchEngine[]) => void;
  onCancel?: () => void;
}

const resetEditEngineData = () => {
  return {
    id: '',
    name: '',
    url: '',
    default: false,
  };
};

export default function SearchEngineModal({
  visible = false,
  data,
  onOk,
  onCancel,
}: SearchEngineModalProps) {
  const { $fmt } = useIntlUtls();
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const nameInputRef = useRef<InputRef>(null);

  const [editEngineData, setEditEngineData] =
    useState<SearchEngine>(resetEditEngineData());
  const [formVisible, setFormVisible] = useState(false);

  const [engines, setEngines] = useState<SearchEngine[]>(data);

  useEffect(() => {
    if (visible) {
      setEngines(data);
      setEditEngineData(resetEditEngineData());
      setFormVisible(false);
    }
  }, [visible, data]);

  useEffect(() => {
    if (formVisible) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 30);
    } else {
      setEditEngineData(resetEditEngineData());
      resetFormValues();
    }
  }, [formVisible]);

  const resetFormValues = useCallback(
    (values?: SearchEngine) => {
      form.setFieldsValue({
        name: values?.name || editEngineData.name,
        url: values?.url || editEngineData.url,
      });
    },
    [form, editEngineData],
  );

  const handleEngineEdit = useCallback(
    (engine: SearchEngine) => {
      setEditEngineData(engine);
      resetFormValues(engine);
      setFormVisible(true);
    },
    [resetFormValues],
  );

  const handleEngineSaveEdit = useCallback(() => {
    form
      .validateFields()
      .then(() => {
        const { name, url } = form.getFieldsValue();
        if (editEngineData.id) {
          // 编辑搜索引擎
          const newEngines = engines.map(e =>
            e.id === editEngineData.id ? { ...e, name: name.trim(), url: url.trim() } : e,
          );
          setEngines(newEngines);
        } else {
          // 添加搜索引擎
          setEngines([
            ...engines,
            {
              id: `custom_${getRandomId(6)}`,
              name: name.trim(),
              url: url.trim(),
            },
          ]);
        }
        setEditEngineData(resetEditEngineData());
        resetFormValues();
        setFormVisible(false);
      })
      .catch(() => {
        console.log('必填项校验失败');
      });
  }, [editEngineData, engines, form, resetFormValues]);

  const handleEngineRemove = useCallback(
    async (id: string) => {
      if (engines.length <= 1) return;
      const newList = engines.filter(e => e.id !== id);
      setEngines(newList);
      setEditEngineData(resetEditEngineData());
      resetFormValues();
      setFormVisible(false);
    },
    [engines, editEngineData, $fmt, resetFormValues],
  );

  const handleSetAsDefault = useCallback(
    (id: string) => {
      const newList = engines.map(e => ({
        ...e,
        default: e.id === id,
      }));
      setEngines(newList);
    },
    [engines],
  );

  const handleAddEngine = useCallback(() => {
    setEditEngineData(resetEditEngineData());
    resetFormValues();
    setFormVisible(true);
  }, [resetFormValues]);

  const handleFormCancel = useCallback(() => {
    setEditEngineData(resetEditEngineData());
    resetFormValues();
    setFormVisible(false);
  }, [resetFormValues]);

  const handleOk = useCallback(() => {
    onOk?.(engines);
  }, [engines, onOk]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const getActionItems = (engine: SearchEngine): MenuProps['items'] => [
    {
      key: 'setAsDefault',
      label: $fmt('common.setAsDefault'),
      icon: <StarOutlined />,
      disabled: engine.default,
      onClick: e => {
        e?.domEvent?.stopPropagation();
        handleSetAsDefault(engine.id);
      },
    },
    {
      key: 'edit',
      label: $fmt('common.edit'),
      icon: <EditOutlined />,
      onClick: e => {
        e?.domEvent?.stopPropagation();
        handleEngineEdit(engine);
      },
    },
    {
      key: 'remove',
      label: $fmt('common.remove'),
      icon: <DeleteOutlined />,
      disabled: engines.length <= 1 || engine.default,
      onClick: e => {
        e?.domEvent?.stopPropagation();
        handleEngineRemove(engine.id);
      },
    },
  ];

  return (
    <Drawer
      title={$fmt('newtab.manageEngines')}
      width={520}
      open={visible}
      onClose={handleCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleCancel}>{$fmt('common.cancel')}</Button>
          <Button type="primary" onClick={handleOk}>
            {$fmt('common.save')}
          </Button>
        </div>
      }
    >
      <StyledEngineList>
        {engines.map((engine, idx) => (
          <StyledEngineItem key={engine.id} onClick={() => handleSetAsDefault(engine.id)}>
            <Favicon pageUrl={engine.url!} favIconUrl="" size={18}></Favicon>

            <StyledEngineItemInfo>
              <span className="engine-item-name">{engine.name}</span>
            </StyledEngineItemInfo>
            {engine.default && (
              <span className="engine-item-default">{$fmt('common.default')}</span>
            )}
            <Dropdown
              menu={{ items: getActionItems(engine) }}
              destroyPopupOnHide
              trigger={['click']}
            >
              <StyledActionIconBtn $size={14} onClick={e => e.stopPropagation()}>
                <MoreOutlined />
              </StyledActionIconBtn>
            </Dropdown>
          </StyledEngineItem>
        ))}
      </StyledEngineList>

      <Button type="dashed" block onClick={handleAddEngine} style={{ marginTop: 8 }}>
        {$fmt('newtab.addEngine')}
      </Button>

      {formVisible && (
        <Modal
          title={editEngineData.id ? $fmt('newtab.editEngine') : $fmt('newtab.addEngine')}
          open={formVisible}
          onOk={handleEngineSaveEdit}
          onCancel={handleFormCancel}
          okText={$fmt('common.save')}
          cancelText={$fmt('common.cancel')}
        >
          <Form
            form={form}
            name="edit-engine-form"
            initialValues={{ name: editEngineData.name, url: editEngineData.url }}
            layout="vertical"
            autoComplete="off"
            onFinish={handleEngineSaveEdit}
          >
            <Form.Item
              label={$fmt('common.name')}
              name="name"
              rules={[{ required: true }]}
            >
              <Input ref={nameInputRef} />
            </Form.Item>
            <Form.Item
              label={$fmt('newtab.engineUrl')}
              name="url"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item style={{ display: 'none' }}>
              <Button type="primary" htmlType="submit">
                {$fmt('common.save')}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Drawer>
  );
}
