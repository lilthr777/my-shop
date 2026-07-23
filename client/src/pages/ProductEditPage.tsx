import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, TextArea, Toast, Typography,
} from '@douyinfe/semi-ui'
import { useShopStore } from '../store/shopStore'
import type { ProductDraft } from '../types'
import { getProduct, createProduct, updateProduct, submitAudit } from '../api/products'
import { getCategories } from '../api/categories'

const { Text } = Typography

const freightTemplateOptions = ['全国包邮', '按地区计费', '满 99 包邮', '冷链专线']
const deliveryPromiseOptions = ['24 小时内发货', '48 小时内发货', '预售 7 天内发货']
const afterSaleOptions = ['7 天无理由退换', '15 天无理由退换', '不支持无理由退换']
const productSpecValueOptions: Record<string, string[]> = {
  color: ['深灰', '米白', '松石绿', '曜石黑', '海盐蓝', '奶油白', '抹茶绿'],
  size: ['38', '39', '40', '41', '42', '43', '44'],
}

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const basic = useShopStore((s) => s.productDraft.basic)
  const media = useShopStore((s) => s.productDraft.media)
  const pricing = useShopStore((s) => s.productDraft.pricing)
  const logistics = useShopStore((s) => s.productDraft.logistics)
  const specs = useShopStore((s) => s.productDraft.specs)
  const updateProductBasic = useShopStore((s) => s.updateProductBasic)
  const updateProductMedia = useShopStore((s) => s.updateProductMedia)
  const updateProductPricing = useShopStore((s) => s.updateProductPricing)
  const updateProductLogistics = useShopStore((s) => s.updateProductLogistics)
  const updateProductSpecName = useShopStore((s) => s.updateProductSpecName)
  const updateProductSpecValues = useShopStore((s) => s.updateProductSpecValues)
  const resetProductDraft = useShopStore((s) => s.resetProductDraft)
  const [saving, setSaving] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    getCategories().then((tree: any[]) => {
      const options: { value: string; label: string }[] = []
      const walk = (nodes: any[], parentName = '') => {
        nodes.forEach((c: any) => {
          const fullName = parentName ? `${parentName} / ${c.name}` : c.name
          if (c.level >= 2) options.push({ value: String(c.id), label: fullName })
          if (c.children?.length) walk(c.children, fullName)
        })
      }
      walk(tree)
      setCategoryOptions(options)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    resetProductDraft()
    if (isEdit) {
      getProduct(parseInt(id!)).then((p) => {
        updateProductBasic('title', p.title)
        updateProductBasic('subtitle', p.subtitle || '')
        updateProductBasic('category', String(p.categoryId || ''))
        updateProductBasic('status', p.status as ProductDraft['basic']['status'])
        updateProductMedia('coverUrl', p.coverUrl || '')
        if (p.skus.length > 0) {
          updateProductPricing('price', p.skus[0].price / 100)
          updateProductPricing('marketPrice', p.skus[0].marketPrice / 100)
          updateProductPricing('stock', p.skus.reduce((s: number, sk: any) => s + sk.stock, 0))
        }
        updateProductLogistics('freightTemplate', p.freightTemplate)
        updateProductLogistics('deliveryPromise', p.deliveryPromise)
        updateProductLogistics('afterSale', p.afterSale)
        if (p.specs?.length > 0) {
          p.specs.forEach((sp: any, i: number) => {
            if (specs[i]) {
              updateProductSpecName(specs[i].id, sp.name || '')
              updateProductSpecValues(specs[i].id, sp.values || [])
            }
          })
        }
      }).catch(() => Toast.error('加载商品信息失败'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const skuRows = useMemo(() => {
    const activeSpecs = specs.filter((spec) => spec.name.trim() && spec.values.length > 0)
    const [primarySpec, secondarySpec] = activeSpecs
    if (!primarySpec) return []
    if (!secondarySpec) {
      return primarySpec.values.map((value, index) => ({
        key: `${primarySpec.id}-${value}`,
        specText: `${primarySpec.name}: ${value}`,
        specCombo: { [primarySpec.id]: value },
        price: pricing.price,
        stock: Math.max(Math.floor(pricing.stock / primarySpec.values.length), 0),
        code: `SKU-${index + 1}`,
      }))
    }
    return primarySpec.values.flatMap((pv, pi) =>
      secondarySpec.values.map((sv, si) => ({
        key: `${pv}-${sv}`,
        specText: `${primarySpec.name}: ${pv} / ${secondarySpec.name}: ${sv}`,
        specCombo: { [primarySpec.id]: pv, [secondarySpec.id]: sv },
        price: pricing.price,
        stock: Math.max(Math.floor(pricing.stock / (primarySpec.values.length * secondarySpec.values.length)), 0),
        code: `SKU-${pi + 1}${si + 1}`,
      })),
    )
  }, [pricing.price, pricing.stock, specs])

  const publishChecks = useMemo(() => [
    { label: '商品标题', passed: Boolean(basic.title.trim()) },
    { label: '商品类目', passed: Boolean(basic.category) },
    { label: '商品封面', passed: Boolean(media.coverUrl.trim()) },
    { label: '价格库存', passed: pricing.price > 0 && pricing.stock > 0 },
    { label: '规格组合', passed: skuRows.length > 0 },
  ], [basic.title, basic.category, media.coverUrl, pricing.price, pricing.stock, skuRows.length])

  const canPublish = publishChecks.every((item) => item.passed)

  const buildBody = () => ({
    title: basic.title,
    subtitle: basic.subtitle,
    categoryId: parseInt(basic.category) || 11,
    coverUrl: media.coverUrl,
    freightTemplate: logistics.freightTemplate,
    deliveryPromise: logistics.deliveryPromise,
    afterSale: logistics.afterSale,
    specs: specs.filter((s) => s.name.trim() && s.values.length > 0).map((s) => s),
    skus: skuRows.map((sku) => ({
      skuCode: sku.code,
      specCombo: sku.specCombo,
      price: sku.price * 100,
      marketPrice: pricing.marketPrice * 100,
      stock: sku.stock,
    })),
  })

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const body = buildBody()
      if (isEdit) {
        await updateProduct(parseInt(id!), body)
      } else {
        await createProduct(body)
      }
      Toast.success('草稿已保存')
      navigate('/products')
    } catch (err: any) {
      Toast.error(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitAudit = async () => {
    if (!canPublish) { Toast.warning('请完善必填项'); return }
    setSaving(true)
    try {
      let productId = isEdit ? parseInt(id!) : 0
      if (!isEdit) {
        const result = await createProduct(buildBody())
        productId = result.id
      } else {
        await updateProduct(parseInt(id!), buildBody())
      }
      await submitAudit(productId)
      Toast.success('已提交审核')
      navigate('/products')
    } catch (err: any) {
      Toast.error(err.message || '提交失败')
    } finally {
      setSaving(false)
    }
  }

  const skuColumns = useMemo(() => [
    { title: '规格组合', dataIndex: 'specText' },
    { title: 'SKU 编码', dataIndex: 'code' },
    { title: '销售价', dataIndex: 'price', render: (price: number) => `¥ ${price.toFixed(2)}` },
    { title: '库存', dataIndex: 'stock' },
  ], [])

  const renderField = (label: string, required: boolean, node: React.ReactNode) => (
    <div className="field">
      <Text type="secondary">
        {required && <Text type="danger">* </Text>}
        {label}
      </Text>
      {node}
    </div>
  )

  return (
    <div className="publish-grid">
      <Form onSubmit={handleSaveDraft} style={{ display: 'contents' }}>
        <Card className="content-card" title={isEdit ? '编辑商品' : '发布商品'}>
          <Space vertical align="start" spacing={16} className="form-section">
            {renderField('商品标题', true,
              <Input placeholder="请输入商品标题" value={basic.title} onChange={(v) => updateProductBasic('title', v)} />,
            )}
            {renderField('商品卖点', false,
              <TextArea autosize maxCount={80} placeholder="请输入商品卖点" value={basic.subtitle} onChange={(v) => updateProductBasic('subtitle', v)} />,
            )}
            {renderField('商品类目', true,
              <Select showClear placeholder="请选择商品类目" value={basic.category || undefined} onChange={(v) => updateProductBasic('category', v ? String(v) : '')}>
                {categoryOptions.map((cat) => <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>)}
              </Select>,
            )}
          </Space>
        </Card>

        <Card className="content-card" title="价格与库存">
          <Space vertical align="start" spacing={16} className="form-section">
            {renderField('销售价 (元)', true,
              <InputNumber prefix="¥" min={0} value={pricing.price} onChange={(v) => updateProductPricing('price', Number(v) || 0)} />,
            )}
            {renderField('划线价 (元)', false,
              <InputNumber prefix="¥" min={0} value={pricing.marketPrice} onChange={(v) => updateProductPricing('marketPrice', Number(v) || 0)} />,
            )}
            {renderField('总库存', true,
              <InputNumber min={0} value={pricing.stock} onChange={(v) => updateProductPricing('stock', Number(v) || 0)} />,
            )}
          </Space>
        </Card>

        <Card className="content-card" title="商品素材">
          <Space vertical align="start" spacing={16} className="form-section">
            {renderField('封面图片 URL', true,
              <Input placeholder="请输入图片链接" value={media.coverUrl} onChange={(v) => updateProductMedia('coverUrl', v)} />,
            )}
          </Space>
          <div className="media-preview">
            {media.coverUrl ? <img src={media.coverUrl} alt={basic.title} /> : <Text type="tertiary">暂无封面预览</Text>}
          </div>
        </Card>

        <Card className="content-card" title="物流与售后">
          <Space vertical align="start" spacing={16} className="form-section">
            {renderField('运费模板', false,
              <Select value={logistics.freightTemplate} onChange={(v) => updateProductLogistics('freightTemplate', String(v))}>
                {freightTemplateOptions.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>,
            )}
            {renderField('发货承诺', false,
              <Select value={logistics.deliveryPromise} onChange={(v) => updateProductLogistics('deliveryPromise', String(v))}>
                {deliveryPromiseOptions.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>,
            )}
            {renderField('售后政策', false,
              <Select value={logistics.afterSale} onChange={(v) => updateProductLogistics('afterSale', String(v))}>
                {afterSaleOptions.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>,
            )}
          </Space>
        </Card>

        <Card className="content-card specs-card" title="商品规格">
          <Space vertical align="start" spacing={16} className="form-section">
            {specs.map((spec) => (
              <div className="spec-row" key={spec.id}>
                <Input value={spec.name} onChange={(v) => updateProductSpecName(spec.id, v)} />
                <Select multiple value={spec.values} style={{ width: '100%' }} onChange={(v) => updateProductSpecValues(spec.id, v as string[])}>
                  {(productSpecValueOptions[spec.id] ?? spec.values).map((val) => <Select.Option key={val} value={val}>{val}</Select.Option>)}
                </Select>
              </div>
            ))}
          </Space>
        </Card>

        <Card className="content-card specs-card" title="SKU 组合预览">
          <Table columns={skuColumns} dataSource={skuRows} pagination={false} rowKey="key" />
        </Card>

        <Card className="content-card specs-card" title="发布确认">
          <div className="publish-footer">
            <div className="publish-checks">
              {publishChecks.map((item) => (
                <Tag color={item.passed ? 'green' : 'orange'} key={item.label}>
                  {item.passed ? '已完成' : '待完善'} · {item.label}
                </Tag>
              ))}
            </div>
            <Space>
              <Button onClick={handleSaveDraft} loading={saving}>保存草稿</Button>
              <Button theme="solid" type="primary" disabled={!canPublish} onClick={handleSubmitAudit} loading={saving}>
                提交审核
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  )
}
