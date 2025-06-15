#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubernetesVersion } from 'aws-cdk-lib/aws-eks';

const app = new cdk.App();
const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;

const repoUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';
const flaskAppPath = 'envs/dev';

const blueprint = blueprints.EksBlueprint.builder()
  .account(account)
  .region(region)
  .version(KubernetesVersion.V1_29)
  .addOns(
    new blueprints.addons.ArgoCDAddOn({
      bootstrapRepo: {
        repoUrl,
        targetRevision: 'main',
        path: flaskAppPath
      }
    }),
    new blueprints.addons.MetricsServerAddOn(),
    new blueprints.addons.ClusterAutoScalerAddOn(),
    new blueprints.addons.AwsLoadBalancerControllerAddOn()
  );

blueprints.CodePipelineStack.builder()
  .name('MyEksPipeline')
  .repository({
    repoUrl: 'ghitalazar/cdk-pipeline-eks-argocd', // ✅ FIXED
    credentialsSecretName: 'cdk-pipeline-github-token',
    targetRevision: 'main'
  })
  .owner('ghitalazar')
  .wave({
    id: 'eks-deploy',
    stages: [{ id: 'dev', stackBuilder: blueprint }]
  })
  .build(app, 'PipelineStack', { env: { account, region } });
